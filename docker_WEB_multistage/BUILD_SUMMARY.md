# 多阶段构建总结

## ✅ 构建完成

**构建时间**: 2025-11-04  
**构建方式**: 常规多阶段构建  
**结果位置**: `docker-multistage-output/output/`

## 📦 镜像信息

| 服务 | 镜像名称 | 镜像大小 | 导出文件大小 |
|------|---------|---------|-------------|
| 前端 | morphtesser-frontend:multistage | 232MB | 94.9MB |
| 后端 | morphtesser-backend:multistage | 771MB | 277MB |

## 🎯 多阶段构建优势

1. **镜像体积优化**：
   - 前端：232MB（vs 传统方式可能 500MB+）
   - 后端：771MB（vs 传统方式可能 1GB+）

2. **安全性提升**：
   - 构建工具不进入最终镜像
   - 源代码不进入最终镜像
   - 使用非 root 用户运行

3. **构建环境一致**：
   - 所有依赖在容器内安装
   - 不依赖本地环境

## 📂 文件结构

```
docker-multistage-output/
├── output/                                    # 构建结果
│   ├── morphtesser-frontend_multistage.tar   (94.9MB)
│   └── morphtesser-backend_multistage.tar    (277MB)
├── Dockerfile.frontend                        # 前端构建配置
├── Dockerfile.backend                         # 后端构建配置
├── docker-compose.yml                         # Compose 配置
├── nginx.conf                                 # Nginx 配置
└── README.md                                  # 使用说明
```

## 🔄 构建流程

### 前端
1. 阶段1：Node.js 构建 → 生成 `build/` 目录
2. 阶段2：Nginx 运行 → 复制 `build/` 到 Nginx

### 后端
1. 阶段1：Maven 构建 → 生成 `*.jar` 文件
2. 阶段2：JRE 运行 → 复制 JAR 到运行环境

## 🚀 部署到服务器

1. **传输文件**：
   ```bash
   scp docker-multistage-output/output/*.tar user@server:/opt/morphtesser/
   ```

2. **导入镜像**：
   ```bash
   docker load -i morphtesser-frontend_multistage.tar
   docker load -i morphtesser-backend_multistage.tar
   ```

3. **启动服务**：
   ```bash
   docker-compose up -d
   ```

