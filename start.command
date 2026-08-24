#!/bin/bash
cd "$(dirname "$0")"
echo "正在启动作业压缩包收集服务..."
python3 app.py
