"""将 Pygame 源码自动改造为 pygbag 可构建的 Web 版本。"""

from __future__ import annotations

import re
from pathlib import Path

GAME_BOOTSTRAP = "create_room(current_room_type)\nroom_waves += 1"


def webify_pygame_source(source: str) -> str:
    if "async def main()" in source and "asyncio.run(main())" in source:
        return source

    if "import asyncio" not in source:
        source = source.replace("import pygame", "import asyncio\nimport pygame", 1)

    idx = source.find(GAME_BOOTSTRAP)
    if idx == -1:
        raise ValueError("未找到游戏主循环起始位置，无法 Web 化。")

    prefix = source[:idx].rstrip()
    body = source[idx:].rstrip()

    if body.endswith("pygame.quit()"):
        body = body[: -len("pygame.quit()")].rstrip()

    body = re.sub(
        r"(?m)^while running:\n(\s*)clock\.tick\(FPS\)",
        r"while running:\n\1clock.tick(FPS)\n\1await asyncio.sleep(0)",
        body,
        count=1,
    )

    indented = "\n".join(f"    {line}" if line else "" for line in body.splitlines())
    return (
        f"{prefix}\n\n"
        "async def main():\n"
        f"{indented}\n"
        "    pygame.quit()\n\n"
        "asyncio.run(main())\n"
    )


def prepare_pygbag_project(py_source: Path, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    source = py_source.read_text(encoding="utf-8", errors="ignore")
    web_source = webify_pygame_source(source)
    main_py = out_dir / "main.py"
    main_py.write_text(web_source, encoding="utf-8")
    return main_py
