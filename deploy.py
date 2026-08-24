"""从收集目录解压作业压缩包并定位游戏入口。"""

from __future__ import annotations

import hashlib
import json
import re
import shutil
from datetime import datetime
from pathlib import Path
from zipfile import ZipFile

from game_packager import build_pygame_package, package_downloads, save_windows_exe
from intro_notes import read_game_meta_from_zip
from pygame_page import render_pygame_play_page

META_FILENAME = ".deploy-meta.json"
PYGAME_LANDING = "__play__.html"


def slug_from_zip_name(zip_name: str) -> str:
    stem = Path(zip_name).stem
    digest = hashlib.sha256(stem.encode("utf-8")).hexdigest()[:10]
    return digest


def parse_submission_name(zip_name: str) -> dict:
    """从压缩包文件名解析提交信息（格式：组长姓名 作品名称）。"""
    stem = Path(zip_name).stem
    parts = stem.split()
    if len(parts) >= 2:
        return {
            "leader": " ".join(parts[:-1]),
            "work": parts[-1],
            "title": stem,
        }
    return {"leader": "", "work": stem, "title": stem}


def _decode_zip_name(name: str) -> str:
    if name.endswith("/"):
        name = name[:-1]
    for encoding in ("gbk", "utf-8", "cp437"):
        try:
            return name.encode("cp437").decode(encoding)
        except (UnicodeDecodeError, UnicodeEncodeError):
            continue
    return name


def _extract_zip(zf: ZipFile, deploy_root: Path) -> None:
    for info in zf.infolist():
        if info.is_dir():
            continue
        rel_name = _decode_zip_name(info.filename)
        target = deploy_root / rel_name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(zf.read(info))


def _find_html_entry(root: Path) -> str | None:
    html_files: list[tuple[int, str, str]] = []
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() != ".html":
            continue
        if path.name == PYGAME_LANDING:
            continue
        rel = path.relative_to(root).as_posix()
        depth = rel.count("/")
        priority = 0 if path.name.lower() == "index.html" else 1
        html_files.append((depth, priority, rel))

    if not html_files:
        return None

    html_files.sort(key=lambda item: (item[0], item[1], item[2]))
    return html_files[0][2]


def _score_python_entry(path: Path) -> int:
    name = path.name.lower()
    score = path.stat().st_size // 1000
    if "game" in name:
        score += 80
    if re.search(r"\(\d+\)", name):
        score += 20
    if any(token in name for token in ("test", "server", "start")):
        score -= 60

    try:
        head = path.read_text(encoding="utf-8", errors="ignore")[:12000]
    except OSError:
        return score

    if "pygame.init" in head:
        score += 200
    elif "import pygame" in head or "from pygame" in head:
        score += 120
    if "__main__" in head:
        score += 30
    return score


def _find_python_entry(root: Path) -> tuple[str, str] | None:
    py_files = [path for path in root.rglob("*.py") if path.is_file()]
    if not py_files:
        return None

    best = max(py_files, key=_score_python_entry)
    if _score_python_entry(best) < 50:
        return None

    rel = best.relative_to(root).as_posix()
    try:
        head = best.read_text(encoding="utf-8", errors="ignore")[:12000]
    except OSError:
        head = ""

    runtime = "pygame" if "pygame" in head else "python"
    return rel, runtime


def _find_exe_entry(root: Path) -> str | None:
    """在目录中寻找 .exe 文件，优先取路径最浅、体积最大的。"""
    candidates = []
    for path in root.rglob("*.exe"):
        if not path.is_file():
            continue
        rel = path.relative_to(root).as_posix()
        depth = rel.count("/")
        size = path.stat().st_size
        candidates.append((depth, -size, rel))
    if not candidates:
        return None
    candidates.sort()
    return candidates[0][2]


def _detect_caption(py_path: Path) -> str:
    try:
        head = py_path.read_text(encoding="utf-8", errors="ignore")[:8000]
    except OSError:
        return ""
    match = re.search(r'set_caption\(\s*["\']([^"\']+)["\']', head)
    return match.group(1) if match else ""


def _generate_pygame_landing(deploy_root: Path, meta: dict, py_entry: str, runtime: str) -> str:
    try:
        meta_with_slug = {**meta, "slug": meta.get("slug", "")}
        package_info = build_pygame_package(deploy_root, py_entry, meta_with_slug)
        meta["package"] = package_info
    except Exception as exc:
        meta["package"] = {"error": str(exc), "exe_ready": False}

    html = render_pygame_play_page({**meta, "package": meta.get("package", {})}, py_entry)
    landing_path = deploy_root / PYGAME_LANDING
    landing_path.write_text(html, encoding="utf-8")
    return PYGAME_LANDING


def _meta_path(deploy_root: Path) -> Path:
    return deploy_root / META_FILENAME


def read_deploy_meta(deploy_root: Path) -> dict | None:
    meta_file = _meta_path(deploy_root)
    if not meta_file.is_file():
        return None
    try:
        return json.loads(meta_file.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def write_deploy_meta(deploy_root: Path, meta: dict) -> None:
    _meta_path(deploy_root).write_text(
        json.dumps(meta, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _build_play_url(meta: dict) -> str:
    if meta.get("runtime") == "exe":
        return f"/api/games/{meta['slug']}/download/exe-file"
    return f"/games/{meta['slug']}/{meta['entry_point']}"


def deploy_zip(zip_path: Path, deploy_dir: Path, force: bool = False) -> dict:
    """解压 zip 到 deploy_dir/<slug>/，返回部署信息。"""
    if not zip_path.is_file() or zip_path.suffix.lower() != ".zip":
        raise ValueError("无效的压缩包路径。")

    zip_stat = zip_path.stat()
    slug = slug_from_zip_name(zip_path.name)
    deploy_root = deploy_dir / slug
    parsed = parse_submission_name(zip_path.name)

    existing = read_deploy_meta(deploy_root)
    if (
        not force
        and existing
        and existing.get("zip_name") == zip_path.name
        and existing.get("zip_mtime") == zip_stat.st_mtime
        and existing.get("entry_point")
        and (deploy_root / existing["entry_point"]).is_file()
    ):
        return existing

    if deploy_root.exists():
        try:
            shutil.rmtree(deploy_root)
        except OSError as exc:
            raise ValueError(f"无法清理旧部署目录 {deploy_root.name}（OneDrive 云端文件未完全下载）：{exc}")
    try:
        deploy_root.mkdir(parents=True, exist_ok=True)
    except (OSError, PermissionError) as exc:
        # OneDrive 云端占位符目录（com.apple.fileprovider.dir#N）无法写入
        # 如果已有缓存元数据，优先使用缓存标记为 error 而非崩溃
        if existing and existing.get('entry_point'):
            raise ValueError(
                f"目录 {deploy_root.name} 包含未完全下载的云端文件，请等待 OneDrive 同步完成后再试。"
            )
        raise ValueError(
            f"无法创建部署目录 {deploy_root.name}（OneDrive 云端文件未完全下载）：{exc}\nslug={slug}"
        )

    with ZipFile(zip_path, "r") as zf:
        _extract_zip(zf, deploy_root)

    entry_point = _find_html_entry(deploy_root)
    runtime = "web"
    python_rel = None
    meta_partial: dict = {}

    if not entry_point:
        python_entry = _find_python_entry(deploy_root)
        if python_entry:
            python_rel, runtime = python_entry
            meta_partial = {**parsed, "slug": slug, "zip_name": zip_path.name}
            entry_point = _generate_pygame_landing(deploy_root, meta_partial, python_rel, runtime)
        else:
            exe_entry = _find_exe_entry(deploy_root)
            if exe_entry:
                entry_point = exe_entry
                runtime = "exe"
            else:
                shutil.rmtree(deploy_root)
                raise ValueError(f"未在 {zip_path.name} 中找到 HTML、Python 或 exe 游戏入口。")

    # 从 zip 内置元数据读取简介
    zip_meta = read_game_meta_from_zip(zip_path)

    meta = {
        "slug": slug,
        "zip_name": zip_path.name,
        "zip_mtime": zip_stat.st_mtime,
        "zip_size": zip_stat.st_size,
        "entry_point": entry_point,
        "runtime": runtime,
        "deployed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        **parsed,
    }
    # 简介优先用 zip 内置，parsed 中同名字段兜底
    if zip_meta.get("intro"):
        meta["description"] = zip_meta["intro"]
    if python_rel:
        meta["python_entry"] = python_rel
    if meta_partial.get("package"):
        meta["package"] = meta_partial["package"]

    write_deploy_meta(deploy_root, meta)
    return meta


def _item_from_meta(meta: dict) -> dict:
    item = {
        "slug": meta["slug"],
        "entry_point": meta["entry_point"],
        "runtime": meta.get("runtime", "web"),
        "deployed_at": meta["deployed_at"],
        "status": "ready",
        "play_url": _build_play_url(meta),
    }
    if meta.get("runtime") == "pygame":
        item.update(package_downloads(meta))
        if meta.get("package"):
            item["package"] = meta["package"]
    if meta.get("runtime") == "exe":
        item["has_windows_exe"] = True
    return item


def deploy_all(collect_dir: Path, deploy_dir: Path) -> list[dict]:
    deploy_dir.mkdir(parents=True, exist_ok=True)
    results: list[dict] = []

    for zip_path in sorted(collect_dir.glob("*.zip"), key=lambda p: p.stat().st_mtime, reverse=True):
        item = {
            "zip_name": zip_path.name,
            "zip_size": zip_path.stat().st_size,
            "zip_modified": datetime.fromtimestamp(zip_path.stat().st_mtime).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
            **parse_submission_name(zip_path.name),
        }
        try:
            meta = deploy_zip(zip_path, deploy_dir)
            item.update(_item_from_meta(meta))
        except ValueError as exc:
            exc_str = str(exc)
            # 从错误信息中提取 slug（格式: "...\nslug=<slug>"，可能埋在 Python 堆栈中）
            slug = item.get("slug", "")
            if not slug:
                import re
                m = re.search(r"slug=([a-f0-9]+)", exc_str)
                if m:
                    slug = m.group(1)
                    item["slug"] = slug
                else:
                    # 无法清理旧部署目录的错误不包含 slug，从 zip 名称手工计算
                    slug = slug_from_zip_name(zip_path.name)
                    item["slug"] = slug
            # 去掉错误信息中的 slug 行，只保留人类可读部分
            error_msg = re.sub(r"\nslug=[a-f0-9]+", "", exc_str)
            item.update({"status": "error", "error": error_msg})

        results.append(item)

    return results


def rebuild_windows_exes(collect_dir: Path, deploy_dir: Path) -> list[dict]:
    """为已部署的 Pygame 作品重新打包 Windows .exe（不受 deploy 缓存影响）。"""
    deploy_dir.mkdir(parents=True, exist_ok=True)
    results: list[dict] = []

    for zip_path in sorted(collect_dir.glob("*.zip"), key=lambda p: p.stat().st_mtime, reverse=True):
        item = {
            "zip_name": zip_path.name,
            "zip_size": zip_path.stat().st_size,
            "zip_modified": datetime.fromtimestamp(zip_path.stat().st_mtime).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
            **parse_submission_name(zip_path.name),
        }
        slug = slug_from_zip_name(zip_path.name)
        deploy_root = deploy_dir / slug
        meta = read_deploy_meta(deploy_root)
        py_entry = meta.get("python_entry") if meta else None
        needs_deploy = (
            not meta
            or meta.get("runtime") != "pygame"
            or not py_entry
            or not (deploy_root / py_entry).is_file()
        )

        try:
            if needs_deploy:
                meta = deploy_zip(zip_path, deploy_dir, force=True)
            else:
                package_info = build_pygame_package(deploy_root, py_entry, meta)
                meta["package"] = package_info
                meta["deployed_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                write_deploy_meta(deploy_root, meta)
                landing_path = deploy_root / PYGAME_LANDING
                landing_path.write_text(
                    render_pygame_play_page({**meta, "package": package_info}, py_entry),
                    encoding="utf-8",
                )
        except (ValueError, OSError) as exc:
            item.update({"status": "error", "error": str(exc), "runtime": "pygame"})
            results.append(item)
            continue

        if meta.get("runtime") != "pygame":
            continue

        item.update(_item_from_meta(meta))
        results.append(item)

    return results


def get_game_by_slug(slug: str, collect_dir: Path, deploy_dir: Path) -> dict | None:
    for zip_path in collect_dir.glob("*.zip"):
        if slug_from_zip_name(zip_path.name) != slug:
            continue
        try:
            meta = deploy_zip(zip_path, deploy_dir)
            return {
                **parse_submission_name(zip_path.name),
                **meta,
                "play_url": _build_play_url(meta),
                "status": "ready",
            }
        except ValueError as exc:
            return {
                "slug": slug,
                "zip_name": zip_path.name,
                **parse_submission_name(zip_path.name),
                "status": "error",
                "error": str(exc),
            }
    return None
