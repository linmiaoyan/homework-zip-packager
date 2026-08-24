#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成 MANIFEST.md：收集 zip ↔ deployed 目录对应关系表

规则：`收集/xxx.zip` 的文件名（去掉 .zip）做 SHA256 取前 10 位，
即得 `deployed/<slug>` 目录名。展厅由 `收集/` 中的 zip 自动派生部署。

用法：
    python3 gen_manifest.py            # 生成 MANIFEST.md 并打印预览
    python3 gen_manifest.py --clean    # 生成的同时，删除无对应 zip 的孤儿 deployed 目录

注意：脚本只读 `.deploy-meta.json` 的 title/work 作为显示名，
评分取自 data/ratings.json；孤儿清理仅删除磁盘目录，不影响 git 索引，
如需从版本库彻底移除请用 git rm。
"""
import hashlib
import json
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
COLL = os.path.join(ROOT, "收集")
DEP = os.path.join(ROOT, "deployed")
DATA = os.path.join(ROOT, "data")
OUT = os.path.join(ROOT, "MANIFEST.md")


def slug_of(name: str) -> str:
    """zip 文件名 -> slug（SHA256 前 10 位）"""
    stem = os.path.splitext(name)[0]
    return hashlib.sha256(stem.encode("utf-8")).hexdigest()[:10]


def load_json(path: str):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}


def main() -> int:
    clean = "--clean" in sys.argv

    if not os.path.isdir(COLL):
        print(f"[错误] 找不到收集目录: {COLL}")
        return 1

    zips = sorted(f for f in os.listdir(COLL) if f.endswith(".zip"))
    zip_slugs = {slug_of(f): f for f in zips}
    ratings = load_json(os.path.join(DATA, "ratings.json")).get("games", {})

    # 有效游戏行
    rows = []
    for f in zips:
        slug = slug_of(f)
        meta = load_json(os.path.join(DEP, slug, ".deploy-meta.json"))
        title = meta.get("title") or meta.get("work") or f
        rs = ratings.get(slug, [])
        avg = round(sum(r["score"] for r in rs) / len(rs), 1) if rs else "-"
        rows.append((f, slug, title, avg, len(rs)))

    # 孤儿目录（deployed 下存在但无对应 zip）
    orphans = []
    for d in sorted(os.listdir(DEP)):
        dp = os.path.join(DEP, d)
        if os.path.isdir(dp) and d not in zip_slugs:
            orphans.append(d)

    if clean and orphans:
        for d in orphans:
            shutil.rmtree(os.path.join(DEP, d), ignore_errors=True)
            print(f"[清理] 已删除孤儿目录 deployed/{d}")
        orphans = []

    # 生成 MANIFEST.md
    lines = [
        "# 部署清单 MANIFEST",
        "",
        "> 自动生成：`收集/xxx.zip` 文件名（去 .zip）SHA256 前 10 位 = `deployed/<slug>` 目录名。",
        "> 由 `gen_manifest.py` 生成，请勿手工编辑。刷新：`python3 gen_manifest.py`",
        "",
        f"有效游戏 {len(rows)} 个 ｜ 孤儿目录 {len(orphans)} 个",
        "",
        "| # | slug | 收集 zip 文件 | 显示名 | 平均分 | 评分人数 |",
        "|---|------|------|------|:--:|:--:|",
    ]
    for i, (f, slug, title, avg, n) in enumerate(rows, 1):
        lines.append(f"| {i} | {slug} | {f} | {title} | {avg} | {n} |")

    lines += ["", "## 孤儿目录（无对应 zip）", "", "| slug | 说明 |", "|---|---|"]
    if orphans:
        for d in orphans:
            lines.append(f"| {d} | 源 zip 已移除，可删除（`gen_manifest.py --clean` 一键清理） |")
    else:
        lines.append("| （无） | — |")

    out = "\n".join(lines) + "\n"
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(out)

    # 控制台预览
    print(out)
    print(f"已写入 {OUT}（有效 {len(rows)}，孤儿 {len(orphans)}）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
