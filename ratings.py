"""游戏评分存储。"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

MIN_SCORE = 0
MAX_SCORE = 100


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


def list_ratings(path: Path, slug: str) -> list[dict]:
    data = _load(path)
    items = data["games"].get(slug, [])
    return sorted(items, key=lambda item: item.get("created_at", ""), reverse=True)


def summarize_ratings(path: Path, slug: str) -> dict:
    items = list_ratings(path, slug)
    if not items:
        return {"count": 0, "average": None}
    total = sum(int(item.get("score", 0)) for item in items)
    return {"count": len(items), "average": round(total / len(items), 1)}


def add_rating(path: Path, slug: str, nickname: str, score: int) -> dict:
    nickname = nickname.strip()
    if not nickname:
        raise ValueError("请填写昵称。")
    if len(nickname) > 32:
        raise ValueError("昵称不能超过 32 个字符。")
    if not isinstance(score, int) or score < MIN_SCORE or score > MAX_SCORE:
        raise ValueError(f"分数需在 {MIN_SCORE}–{MAX_SCORE} 之间。")

    data = _load(path)
    items = data["games"].setdefault(slug, [])
    entry = {
        "nickname": nickname,
        "score": score,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    items.append(entry)
    _save(path, data)
    return entry
