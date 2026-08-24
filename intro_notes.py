"""作品简介管理：随压缩包一起提交，从 zip 内置元数据中读取。"""

from __future__ import annotations

import json
from pathlib import Path

# 嵌入 zip 内部的元数据文件名
META_FILENAME = ".game-meta.json"


def read_game_meta_from_zip(zip_path: Path) -> dict:
    """从 zip 包内读取游戏元数据（简介等）。"""
    try:
        from zipfile import ZipFile

        with ZipFile(zip_path, "r") as zf:
            if META_FILENAME not in zf.namelist():
                return {}
            raw = zf.read(META_FILENAME)
            return json.loads(raw.decode("utf-8"))
    except Exception:
        return {}


def build_game_meta(leader: str, work: str, intro: str) -> dict:
    """构建随压缩包提交的元数据。"""
    return {
        "leader": leader.strip(),
        "work": work.strip(),
        "intro": intro.strip(),
    }


def get_intro_for_game(game: dict, store_path: Path) -> dict:
    """
    读取作品简介。
    优先级：deploy meta 中已缓存的 description > 从 zip 内置元数据读取
    """
    # 优先用 deploy meta 中已有的 description（覆盖过的）
    if game.get("description"):
        return {
            "description": game["description"],
            "source": "meta",
        }

    # 从 zip 内置元数据读取
    zip_name = game.get("zip_name", "")
    if zip_name:
        from pathlib import Path

        from naming import sanitize_filename_part

        # 构造可能的 zip 路径（需要传入 collect_dir，
        # 为避免循环依赖，这里只从 game 中的路径信息处理）
        pass

    return {"description": "", "source": "none"}


def set_intro_override(
    store_path: Path,
    slug: str,
    description: str,
    zip_name: str = "",
    match_doc: str | None = None,
    match_score: float | None = None,
) -> None:
    """管理员手动覆盖简介（写入 intro_overrides.json）。"""
    import shutil

    overrides_path = store_path.parent / "intro_overrides.json"
    data: dict = {}
    if overrides_path.is_file():
        try:
            data = json.loads(overrides_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass

    data[slug] = {
        "description": description.strip(),
        "zip_name": zip_name,
        "updated_at": "",
    }

    overrides_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def clear_intro_override(store_path: Path, slug: str) -> None:
    """清除管理员覆盖，恢复 zip 内置简介。"""
    from pathlib import Path

    overrides_path = store_path.parent / "intro_overrides.json"
    if not overrides_path.is_file():
        return
    try:
        data: dict = json.loads(overrides_path.read_text(encoding="utf-8"))
        data.pop(slug, None)
        overrides_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    except (json.JSONDecodeError, OSError):
        pass


def get_intro_override(slug: str, store_path: Path) -> str:
    """查询管理员覆盖的简介内容。"""
    from pathlib import Path

    overrides_path = store_path.parent / "intro_overrides.json"
    if not overrides_path.is_file():
        return ""
    try:
        data: dict = json.loads(overrides_path.read_text(encoding="utf-8"))
        return data.get(slug, {}).get("description", "")
    except (json.JSONDecodeError, OSError):
        return ""


def list_admin_items(games: list[dict], store_path: Path) -> list[dict]:
    """生成管理员面板列表数据。"""
    items = []
    for game in games:
        slug = game.get("slug", "")
        override = get_intro_override(slug, store_path)
        items.append(
            {
                "slug": slug,
                "zip_name": game.get("zip_name"),
                "leader": game.get("leader", ""),
                "work": game.get("work", ""),
                "title": game.get("title", ""),
                "description": override or game.get("description", ""),
                "source": "admin" if override else "zip",
            }
        )
    return items
