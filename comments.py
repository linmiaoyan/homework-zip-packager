"""作品评论存储。"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

MAX_COMMENT_LEN = 500


def _load(path: Path) -> dict:
    if not path.is_file():
        return {"games": {}}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"games": {}}
    if "games" not in data or not isinstance(data["games"], dict):
        return {"games": {}}
    return data


def _save(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def list_comments(path: Path, slug: str) -> list[dict]:
    data = _load(path)
    items = data["games"].get(slug, [])
    return sorted(items, key=lambda item: item.get("created_at", ""), reverse=True)


def comment_count(path: Path, slug: str) -> int:
    return len(list_comments(path, slug))


def add_comment(path: Path, slug: str, content: str, nickname: str = "") -> dict:
    content = content.strip()
    if not content:
        raise ValueError("请填写评论内容。")
    if len(content) > MAX_COMMENT_LEN:
        raise ValueError(f"评论不能超过 {MAX_COMMENT_LEN} 个字符。")

    nickname = nickname.strip()
    if nickname and len(nickname) > 32:
        raise ValueError("昵称不能超过 32 个字符。")
    if not nickname:
        nickname = "匿名"

    data = _load(path)
    items = data["games"].setdefault(slug, [])
    entry = {
        "nickname": nickname,
        "content": content,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    items.append(entry)
    _save(path, data)
    return entry
