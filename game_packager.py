"""将 Pygame 作品打包为可下载的运行包（PyInstaller + 启动脚本）。"""

from __future__ import annotations

import os
import platform
import re
import shutil
import stat
import subprocess
import sys
import zipfile
from pathlib import Path

PACKAGE_DIR = "package"
WINDOWS_EXE_SUFFIX = "-Windows.exe"


def _safe_name(text: str) -> str:
    cleaned = re.sub(r'[<>:"/\\|?*]', "", text.strip())
    return cleaned or "game"


def _force_rmtree(path: Path) -> None:
    if not path.exists():
        return

    def onerror(func, p, _exc_info):
        os.chmod(p, stat.S_IWRITE)
        func(p)

    shutil.rmtree(path, onerror=onerror)


def _pyinstaller_error(result: subprocess.CompletedProcess[str] | None, exc: BaseException | None = None) -> str:
    if exc is not None:
        return str(exc)
    if result is None:
        return "PyInstaller 未运行"
    tail = (result.stderr or result.stdout or "").strip()
    if not tail:
        return f"PyInstaller 退出码 {result.returncode}"
    lines = [line for line in tail.splitlines() if line.strip()]
    return lines[-1][:240]


def _detect_deps(py_path: Path) -> list[str]:
    try:
        source = py_path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return ["pygame"]
    deps = []
    if "pygame" in source:
        deps.append("pygame")
    if "pymunk" in source:
        deps.append("pymunk")
    return deps or ["pygame"]


def _verify_build_deps(deps: list[str]) -> str | None:
    """打包前确认当前 Python 已安装作品依赖，否则 exe 内不会包含 pygame 等库。"""
    missing = []
    for dep in deps:
        try:
            __import__(dep)
        except ImportError:
            missing.append(dep)
    if not missing:
        return None
    names = ", ".join(missing)
    return f"打包环境缺少 {names}，请先运行: pip install -r requirements-build.txt"


def _pyinstaller_extra_args(deps: list[str]) -> list[str]:
    args: list[str] = []
    if "pygame" in deps:
        args.extend(["--collect-all", "pygame", "--hidden-import", "pygame"])
    if "pymunk" in deps:
        args.extend(
            [
                "--hidden-import",
                "pymunk",
                "--hidden-import",
                "pymunk.pygame_util",
            ]
        )
    return args


def _check_pyinstaller_warnings(build_dir: Path, app_name: str, deps: list[str]) -> str | None:
    warn_file = build_dir / app_name / f"warn-{app_name}.txt"
    if not warn_file.is_file():
        return None
    content = warn_file.read_text(encoding="utf-8", errors="ignore")
    for dep in deps:
        # 只匹配顶层 import 缺失，避免把 pygame.K_1 等子模块误报为 pygame 缺失
        marker = f"missing module named {dep} - imported by"
        if marker in content:
            return f"PyInstaller 未打包 {dep}，请确认已安装 requirements-build.txt 中的依赖"
    return None


def _write_launchers(work_dir: Path, script_name: str, deps: list[str], title: str) -> None:
    readme = f"""{title}
========

推荐：直接下载并使用 Windows .exe 或 Mac 可执行版，无需安装 Python。

若使用源码包：
  Windows：双击「启动游戏.bat」（需已安装 Python 3.10+）
  Mac/Linux：运行 ./启动游戏.sh

依赖：{', '.join(deps)}
"""
    (work_dir / "游玩说明.txt").write_text(readme, encoding="utf-8")


def _zip_directory(source_dir: Path, zip_path: Path) -> None:
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in source_dir.rglob("*"):
            if path.is_file():
                zf.write(path, path.relative_to(source_dir).as_posix())


def _pyinstaller_cmd(
    app_name: str,
    script_name: str,
    onefile: bool,
    *,
    dist_dir: Path,
    build_dir: Path,
    spec_dir: Path,
) -> list[str]:
    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--windowed",
        "--name",
        app_name,
        "--distpath",
        str(dist_dir),
        "--workpath",
        str(build_dir),
        "--specpath",
        str(spec_dir),
    ]
    cmd.append("--onefile" if onefile else "--onedir")
    cmd.append(script_name)
    return cmd


def _run_pyinstaller(work_dir: Path, script_name: str, app_name: str, onefile: bool) -> tuple[Path | None, str | None]:
    try:
        import PyInstaller  # noqa: F401
    except ImportError:
        return None, "未安装 PyInstaller，请运行 pip install -r requirements-build.txt"

    deps = _detect_deps(work_dir / script_name)
    dep_error = _verify_build_deps(deps)
    if dep_error:
        return None, dep_error

    work_dir = work_dir.resolve()
    build_dir = (work_dir / "_pyinstaller_build").resolve()
    dist_dir = (work_dir / "_pyinstaller_dist").resolve()
    spec_file = work_dir / f"{app_name}.spec"

    for path in (build_dir, dist_dir):
        _force_rmtree(path)
    if spec_file.exists():
        spec_file.unlink()

    cmd = _pyinstaller_cmd(
        app_name,
        script_name,
        onefile,
        dist_dir=dist_dir,
        build_dir=build_dir,
        spec_dir=work_dir,
    )
    cmd.extend(_pyinstaller_extra_args(deps))

    try:
        result = subprocess.run(cmd, cwd=work_dir, capture_output=True, text=True, timeout=900)
    except (OSError, subprocess.TimeoutExpired) as exc:
        return None, _pyinstaller_error(None, exc)

    if result.returncode != 0:
        return None, _pyinstaller_error(result)

    warn_error = _check_pyinstaller_warnings(build_dir, app_name, deps)
    if warn_error:
        return None, warn_error

    if onefile:
        exe = dist_dir / f"{app_name}.exe"
        if exe.is_file():
            # 正常包含 pygame 的 exe 通常 > 20MB；过小说明依赖很可能未打进包内
            if "pygame" in deps and exe.stat().st_size < 15 * 1024 * 1024:
                return None, "生成的 exe 体积异常偏小，可能未包含 pygame，请检查打包环境"
            return exe, None
        return None, "PyInstaller 已完成但未找到 .exe 文件"

    app_bundle = dist_dir / f"{app_name}.app"
    if app_bundle.is_dir():
        return app_bundle, None
    app_dir = dist_dir / app_name
    if app_dir.is_dir():
        return app_dir, None
    return None, "PyInstaller 已完成但未找到可执行输出"


def _cleanup_staging(staging: Path, title: str) -> None:
    for cleanup in (staging / "_pyinstaller_build", staging / "_pyinstaller_dist", staging / f"{title}.spec"):
        if cleanup.is_dir():
            _force_rmtree(cleanup)
        elif cleanup.is_file():
            cleanup.unlink()


def _preserve_windows_exe(package_root: Path) -> tuple[bytes, str] | None:
    if not package_root.is_dir():
        return None
    for path in package_root.glob(f"*{WINDOWS_EXE_SUFFIX}"):
        if path.is_file():
            return path.read_bytes(), path.name
    return None


def save_windows_exe(deploy_root: Path, title: str, exe_bytes: bytes) -> str:
    package_root = deploy_root / PACKAGE_DIR
    package_root.mkdir(parents=True, exist_ok=True)
    filename = f"{_safe_name(title)}{WINDOWS_EXE_SUFFIX}"
    out_path = package_root / filename
    out_path.write_bytes(exe_bytes)
    return f"{PACKAGE_DIR}/{filename}"


def build_pygame_package(deploy_root: Path, py_entry: str, meta: dict) -> dict:
    py_path = deploy_root / py_entry
    if not py_path.is_file():
        raise ValueError("找不到 Python 入口文件。")

    work_dir = py_path.parent
    script_name = py_path.name
    title = _safe_name(meta.get("work") or meta.get("title") or "game")
    deps = _detect_deps(py_path)
    system = platform.system()

    package_root = deploy_root / PACKAGE_DIR
    # Windows 打包时始终重新生成 exe；Mac 上才保留已有的 Windows exe
    preserved = _preserve_windows_exe(package_root) if system != "Windows" else None
    if package_root.exists():
        _force_rmtree(package_root)
    package_root.mkdir(parents=True)

    if preserved:
        data, name = preserved
        (package_root / name).write_bytes(data)

    staging = package_root / "staging"
    shutil.copytree(work_dir, staging, ignore=shutil.ignore_patterns("_pyinstaller_*", "*.spec", "__pycache__", "package"))
    _write_launchers(staging, script_name, deps, title)

    source_zip = package_root / f"{title}-源码包.zip"
    _zip_directory(staging, source_zip)

    package_info: dict = {
        "source_zip": f"{PACKAGE_DIR}/{source_zip.name}",
        "built_on": system,
        "deps": deps,
        "exe_ready": False,
    }

    if preserved:
        package_info["windows_exe"] = f"{PACKAGE_DIR}/{preserved[1]}"
        package_info["exe_ready"] = True

    if system == "Windows":
        built, build_error = _run_pyinstaller(staging, script_name, title, onefile=True)
        if built:
            win_exe = package_root / f"{title}{WINDOWS_EXE_SUFFIX}"
            shutil.move(str(built), win_exe)
            package_info["windows_exe"] = f"{PACKAGE_DIR}/{win_exe.name}"
            package_info["exe_ready"] = True
        elif build_error:
            package_info["build_error"] = build_error
        _cleanup_staging(staging, title)
    elif system == "Darwin":
        built, build_error = _run_pyinstaller(staging, script_name, title, onefile=False)
        if built:
            mac_zip = package_root / f"{title}-Mac版.zip"
            _zip_directory(built, mac_zip)
            package_info["mac_zip"] = f"{PACKAGE_DIR}/{mac_zip.name}"
            package_info["exe_ready"] = True
        elif build_error:
            package_info["build_error"] = build_error
        _cleanup_staging(staging, title)

    if staging.exists():
        _force_rmtree(staging)

    return package_info


def package_downloads(meta: dict) -> dict:
    pkg = dict(meta.get("package") or {})
    if pkg.get("exe_zip") and not pkg.get("mac_zip") and not pkg.get("windows_exe"):
        pkg["mac_zip"] = pkg["exe_zip"]

    downloads = []

    if pkg.get("windows_exe"):
        downloads.append(
            {
                "type": "windows",
                "label": "下载 Windows 版（.exe，内置 Python，约 80MB，无需安装）",
                "path": pkg["windows_exe"],
            }
        )
    if pkg.get("mac_zip"):
        downloads.append(
            {
                "type": "mac",
                "label": "下载 Mac 版（解压后双击运行）",
                "path": pkg["mac_zip"],
            }
        )
    elif pkg.get("exe_zip"):
        downloads.append({"type": "mac", "label": "下载可执行版", "path": pkg["exe_zip"]})

    has_native = bool(pkg.get("windows_exe") or pkg.get("mac_zip") or pkg.get("exe_zip"))
    if pkg.get("source_zip") and not has_native:
        downloads.append(
            {
                "type": "source",
                "label": "下载源码包（需 Python 环境）",
                "path": pkg["source_zip"],
            }
        )

    return {
        "downloads": downloads,
        "exe_ready": bool(pkg.get("windows_exe") or pkg.get("mac_zip") or pkg.get("exe_zip")),
        "has_windows_exe": bool(pkg.get("windows_exe")),
    }


def attach_windows_exe(deploy_root: Path, title: str, exe_bytes: bytes) -> dict:
    """写入或更新 Windows exe，并返回 package 字段。"""
    rel = save_windows_exe(deploy_root, title, exe_bytes)
    return {"windows_exe": rel, "exe_ready": True}
