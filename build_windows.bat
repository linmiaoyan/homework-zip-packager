@echo off
chcp 65001 >nul
title 生成 Windows exe 游戏包
echo 正在为 Pygame 作品打包 .exe，首次运行会安装依赖，请稍候…
python --version >nul 2>&1
if errorlevel 1 (
  echo 请先安装 Python 3.10+：https://www.python.org/downloads/
  pause
  exit /b 1
)
python -m pip install -q -r requirements-build.txt
python build_windows_packages.py
echo.
pause
