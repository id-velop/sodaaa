#!/bin/bash
# Neo4j数据快速导出脚本
# 为Linus Torvalds定制的一键导出工具

set -e  # 遇到错误立即退出

echo "🚀 Neo4j数据导出工具 - 快速启动"
echo "=================================="

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到Python3，请先安装Python"
    exit 1
fi

# 检查依赖
echo "📦 检查依赖..."
if ! python3 -c "import neo4j" 2>/dev/null; then
    echo "⚠️  neo4j库未安装，正在安装..."
    pip3 install neo4j
fi

# 检查配置文件
if [ ! -f "config.json" ]; then
    if [ -f "config.example.json" ]; then
        echo "📋 未找到config.json，是否使用示例配置？(y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            cp config.example.json config.json
            echo "⚠️  请编辑config.json文件，设置正确的数据库连接信息"
            echo "   然后重新运行此脚本"
            exit 0
        fi
    fi
    
    echo "❌ 未找到配置文件，请创建config.json或使用命令行参数"
    echo ""
    echo "使用方法："
    echo "  方式1: 创建config.json配置文件"
    echo "  方式2: 直接使用命令行参数"
    echo "    $0 --uri bolt://localhost:7687 --username neo4j --password your_password"
    exit 1
fi

# 运行导出
echo "🔥 开始导出数据..."

if [ $# -eq 0 ]; then
    # 使用配置文件
    python3 neo4j_export_advanced.py --config config.json
else
    # 使用命令行参数
    python3 neo4j_export_advanced.py "$@"
fi

echo ""
echo "✅ 导出完成！检查exports目录中的文件"
echo "📁 导出目录: $(pwd)/exports"

# 显示导出文件信息
if [ -d "exports" ]; then
    echo ""
    echo "📊 最新导出文件："
    ls -lht exports/*.json 2>/dev/null | head -3 || echo "   (未找到JSON文件)"
fi
