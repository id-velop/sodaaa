#!/bin/bash

# Figma Plugin Backend Service 启动脚本

echo "🚀 启动 Figma Plugin Backend Service..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 进入Backend目录
cd Backend

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到.env文件，使用默认配置"
    echo "💡 建议复制 env.example 为 .env 并配置您的API信息"
fi

# 启动服务
echo "🔄 启动服务..."
npm run dev
