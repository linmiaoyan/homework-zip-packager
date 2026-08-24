"""压缩包命名与校验逻辑。"""

from __future__ import annotations

import random
import re

INVALID_CHARS = re.compile(r'[<>:"/\\|?*]')


def generate_doc_number() -> str:
    """生成一个随机 6 位数字编号。"""
    return str(random.randint(100000, 999999))


def sanitize_filename_part(text: str) -> str:
    """移除 Windows 文件名非法字符并压缩空白。"""
    cleaned = INVALID_CHARS.sub("", text.strip())
    return re.sub(r"\s+", " ", cleaned)


def build_archive_name(leader: str, work: str) -> str:
    """构建压缩包文件名：组长姓名 + 作品名称。"""
    parts = [sanitize_filename_part(p) for p in (leader, work)]
    parts = [p for p in parts if p]
    return " ".join(parts)


def preview_filename(leader: str, work: str) -> dict:
    """预览压缩包命名，无需文档号。"""
    leader_clean = sanitize_filename_part(leader)
    work_clean = sanitize_filename_part(work)

    if not leader.strip() and not work.strip():
        return {
            "filename": "",
            "display": "（请填写组长姓名和作品名称）",
            "valid": False,
            "complete": False,
        }

    name = build_archive_name(leader_clean, work_clean)
    if not leader_clean or not work_clean:
        return {
            "filename": f"{name}.zip" if name else "",
            "display": f"{name}.zip" if name else "（命名不完整）",
            "valid": False,
            "complete": False,
        }

    return {
        "filename": f"{name}.zip",
        "display": f"{name}.zip",
        "valid": True,
        "complete": True,
    }
