#!/bin/bash

# ROS2 AI问答助手 Vue版本 - 开发启动脚本

echo "🚀 启动 ROS2 AI问答助手 Vue版本..."

# 检查是否在正确目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在vue目录下运行此脚本"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动开发服务器
echo "🌐 启动开发服务器..."
npm run dev