# 多阶段构建结果

## 📦 构建完成的镜像

### 镜像信息

| 镜像名称 | 标签 | 镜像大小 | 文件大小 |
|---------|------|---------|---------|
| morphtesser-frontend | multistage | 232MB | 94.9MB (tar) |
| morphtesser-backend | multistage | 771MB | 277MB (tar) |

### 构建结果位置

```
docker-multistage-output/
├── output/
│   ├── morphtesser-frontend_multistage.tar   (94.9MB)
│   └── morphtesser-backend_multistage.tar    (277MB)
├── Dockerfile.frontend
├── Dockerfile.backend
├── docker-compose.yml
└── nginx.conf
```

---

## 🚀 使用方法

### 导入镜像

```bash
# 导入前端镜像
docker load -i docker-multistage-output/output/morphtesser-frontend_multistage.tar

# 导入后端镜像
docker load -i docker-multistage-output/output/morphtesser-backend_multistage.tar
```

### 运行容器

#### 方式1：使用 docker-compose（推荐）

```bash
cd docker-multistage-output
docker-compose up -d
```

#### 方式2：手动运行

```bash
# 启动后端
docker run -d --name morphtesser-backend \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  morphtesser-backend:multistage

# 启动前端
docker run -d --name morphtesser-frontend \
  -p 80:80 \
  --link morphtesser-backend:backend \
  morphtesser-frontend:multistage
```

---

## 📊 构建信息

### 前端构建

- **阶段1**: Node.js 18 Alpine（构建环境）
  - 安装依赖并构建生产版本
  - 生成 `/app/build/` 目录

- **阶段2**: Nginx Alpine（运行环境）
  - 复制构建产物到 `/usr/share/nginx/html`
  - 配置 Nginx 反向代理

### 后端构建

- **阶段1**: Maven 3.9 + Eclipse Temurin JDK 21（构建环境）
  - 下载依赖（使用阿里云 Maven 镜像）
  - 编译并打包成 Fat JAR

- **阶段2**: Eclipse Temurin JRE 21（运行环境）
  - 复制 JAR 文件
  - 使用非 root 用户运行

---

## 🔧 配置说明

### 修改 API 地址

编辑 `docker-multistage-output/nginx.conf`，修改反向代理配置：

```nginx
location /api/ {
    proxy_pass http://backend:8080/api/;  # 改为你的后端地址
    ...
}
```

### 修改数据库连接

在 `docker-compose.yml` 或运行命令中设置环境变量：

```bash
-e SPRING_DATASOURCE_URL=jdbc:mysql://your-db-host:3306/morphtesserdb
-e SPRING_DATASOURCE_USERNAME=your_username
-e SPRING_DATASOURCE_PASSWORD=your_password
```

---

## 📝 文件说明

- **Dockerfile.frontend**: 前端多阶段构建配置
- **Dockerfile.backend**: 后端多阶段构建配置
- **docker-compose.yml**: Docker Compose 编排配置
- **nginx.conf**: Nginx 反向代理配置
- **output/**: 导出的镜像文件

---

## ✅ 构建完成时间

2025-11-04 21:19

---

## 🎯 下一步

1. 将镜像文件传输到服务器
2. 在服务器上导入镜像
3. 配置环境变量和数据库连接
4. 启动容器

