#!/bin/bash

# ROS2 AI问答助手 Vue版本 - 生产构建脚本

echo "🏗️  构建 ROS2 AI问答助手 Vue版本..."

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

# 构建生产版本
echo "🔨 构建生产版本..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 构建成功！"
    echo "📁 构建文件位于 dist/ 目录"
    echo "🌐 可以使用 'npm run preview' 预览构建结果"
else
    echo "❌ 构建失败！"
    exit 1
fi