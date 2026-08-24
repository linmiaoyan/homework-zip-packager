"""从收集目录解压作业压缩包并定位游戏入口。"""

from __future__ import annotations

import hashlib
import json
import re
import shutil
from datetime import datetime
from pathlib import Path
from zipfile import ZipFile

META_FILENAME = ".deploy-meta.json"
PYGAME_LANDING = "__play__.html"


def slug_from_zip_name(zip_name: str) -> str:
    stem = Path(zip_name).stem
    digest = hashlib.sha256(stem.encode("utf-8")).hexdigest()[:10]
    return digest


def parse_submission_name(zip_name: str) -> dict:
    stem = Path(zip_name).stem
    parts = stem.split()
    if len(parts) >= 3:
        return {
            "doc": parts[0],
            "leader": " ".join(parts[1:-1]),
            "work": parts[-1],
            "title": stem,
        }
    if len(parts) == 2:
        return {"doc": parts[0], "leader": parts[1], "work": "", "title": stem}
    return {"doc": "", "leader": "", "work": stem, "title": stem}


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


def _detect_caption(py_path: Path) -> str:
    try:
        head = py_path.read_text(encoding="utf-8", errors="ignore")[:8000]
    except OSError:
        return ""
    match = re.search(r'set_caption\(\s*["\']([^"\']+)["\']', head)
    return match.group(1) if match else ""


def _generate_pygame_landing(deploy_root: Path, meta: dict, py_entry: str, runtime: str) -> str:
    py_path = deploy_root / py_entry
    caption = _detect_caption(py_path) or meta.get("work") or meta.get("title", "游戏作品")
    runtime_label = "Pygame 桌面游戏" if runtime == "pygame" else "Python 程序"

    html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{caption}</title>
  <style>
    body {{
      margin: 0;
      font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
    }}
    .panel {{
      max-width: 640px;
      width: 100%;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
    }}
    .badge {{
      display: inline-block;
      background: #7c3aed;
      color: white;
      font-size: 0.82rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
      margin-bottom: 12px;
    }}
    h1 {{ margin: 0 0 8px; font-size: 1.6rem; }}
    p {{ line-height: 1.7; color: #94a3b8; }}
    code, pre {{
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      background: #0b1220;
      border: 1px solid #334155;
      border-radius: 10px;
    }}
    pre {{
      padding: 14px 16px;
      overflow-x: auto;
      color: #cbd5e1;
      margin: 16px 0;
    }}
    ul {{ padding-left: 1.2rem; color: #cbd5e1; }}
    .note {{
      margin-top: 18px;
      padding: 14px 16px;
      border-radius: 12px;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(96, 165, 250, 0.35);
      color: #bfdbfe;
    }}
  </style>
</head>
<body>
  <div class="panel">
    <div class="badge">{runtime_label}</div>
    <h1>{caption}</h1>
    <p>作者：{meta.get("leader") or "未知"} · 文档号 {meta.get("doc") or "—"}</p>
    <p>该作品为 Python 桌面程序，无法在浏览器内直接运行。请下载压缩包后在本地启动。</p>
    <pre>pip install pygame
python "{py_entry.replace('"', '\\"')}"</pre>
    <ul>
      <li>操作：W / A / S / D 移动，鼠标瞄准与射击</li>
      <li>窗口标题：{caption}</li>
      <li>入口文件：<code>{py_entry}</code></li>
    </ul>
    <div class="note">网页端可查看作品说明并评分；实际游玩需在本机运行上述命令。</div>
  </div>
</body>
</html>
"""
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
        shutil.rmtree(deploy_root)
    deploy_root.mkdir(parents=True, exist_ok=True)

    with ZipFile(zip_path, "r") as zf:
        _extract_zip(zf, deploy_root)

    entry_point = _find_html_entry(deploy_root)
    runtime = "web"
    python_rel = None

    if not entry_point:
        python_entry = _find_python_entry(deploy_root)
        if not python_entry:
            shutil.rmtree(deploy_root)
            raise ValueError(f"未在 {zip_path.name} 中找到 HTML 或 Python 游戏入口。")

        python_rel, runtime = python_entry
        meta_partial = {**parsed, "slug": slug, "zip_name": zip_path.name}
        entry_point = _generate_pygame_landing(deploy_root, meta_partial, python_rel, runtime)

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
    if python_rel:
        meta["python_entry"] = python_rel

    write_deploy_meta(deploy_root, meta)
    return meta


def _item_from_meta(meta: dict) -> dict:
    return {
        "slug": meta["slug"],
        "entry_point": meta["entry_point"],
        "runtime": meta.get("runtime", "web"),
        "deployed_at": meta["deployed_at"],
        "status": "ready",
        "play_url": _build_play_url(meta),
    }


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
            item.update({"status": "error", "error": str(exc)})

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
