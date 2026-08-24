@echo off
cd /d "%~dp0"

python -m pip install -r requirements.txt -q
if errorlevel 1 (
    echo 依赖安装失败，请确认已安装 Python 3 和 pip。
    pause
    exit /b 1
)

echo.
echo 作业压缩包收集工具已启动
echo 请在浏览器打开: http://127.0.0.1:5000
echo 按 Ctrl+C 可停止服务
echo.

python app.py
pause
