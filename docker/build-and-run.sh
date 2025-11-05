#!/bin/bash
# MorphTesser Web - Docker 多阶段构建快速启动脚本

echo "=========================================="
echo "MorphTesser Web - Docker 多阶段构建"
echo "=========================================="
echo

cd "$(dirname "$0")"

echo "1. 构建 Docker 镜像..."
docker-compose build

if [ $? -ne 0 ]; then
    echo "构建失败！"
    exit 1
fi

echo
echo "2. 启动服务..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "启动失败！"
    exit 1
fi

echo
echo "=========================================="
echo "启动完成！"
echo "=========================================="
echo
echo "前端访问: http://localhost"
echo "后端 API: http://localhost:8080/api"
echo "MySQL: localhost:3306"
echo
echo "查看日志: docker-compose logs -f"
echo "停止服务: docker-compose down"
echo

