#!/usr/bin/env python3
"""在 Windows 电脑上运行，为所有 Pygame 作品生成 .exe 文件。

用法（Windows）：
  pip install -r requirements-build.txt
  python build_windows_packages.py

生成后 exe 保存在 deployed/<slug>/package/*-Windows.exe，
网页上即可直接提供下载。
"""

from __future__ import annotations

import platform
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
COLLECT_DIR = BASE_DIR / "收集"
DEPLOY_DIR = BASE_DIR / "deployed"

from deploy import rebuild_windows_exes  # noqa: E402


def main() -> int:
    if platform.system() != "Windows":
        print("此脚本需在 Windows 上运行才能生成 .exe 文件。")
        print("当前系统：", platform.system())
        print("Mac 服务器请使用：管理员后台上传 Windows exe，或在 Windows 电脑运行本脚本。")
        return 1

    print("正在为所有 Pygame 作品打包 Windows .exe …")
    games = rebuild_windows_exes(COLLECT_DIR, DEPLOY_DIR)
    pygame_games = [g for g in games if g.get("runtime") == "pygame"]
    if not pygame_games:
        print("未找到 Pygame 作品。")
        return 0

    ok = 0
    for game in pygame_games:
        pkg = game.get("package") or {}
        win = pkg.get("windows_exe")
        err = pkg.get("build_error") or game.get("error")
        if win:
            print(f"  [OK] {game.get('zip_name')} -> {win}")
            ok += 1
        else:
            detail = err or "未生成"
            print(f"  [FAIL] {game.get('zip_name')} -> {detail}")

    print(f"\n完成，共 {len(pygame_games)} 个 Pygame 作品，成功 {ok} 个。请重启或刷新网页后即可下载 .exe。")
    return 0 if ok == len(pygame_games) else 1


if __name__ == "__main__":
    sys.exit(main())
