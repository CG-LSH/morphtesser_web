# MorphTesser Web - Docker 多阶段构建部署指南

## 📦 项目结构

```
.
├── docker/
│   ├── Dockerfile.frontend      # 前端多阶段构建
│   ├── Dockerfile.backend       # 后端多阶段构建
│   ├── docker-compose.yml       # Docker Compose 配置
│   ├── nginx.conf               # Nginx 配置文件
│   └── .dockerignore           # Docker 构建忽略文件
├── morphtesser_web/
│   ├── frontend/                # React 前端
│   └── backend/                # Spring Boot 后端
└── README.md
```

## 🚀 快速开始

### **1. 构建镜像**

```bash
cd docker
docker-compose build
```

### **2. 启动服务**

```bash
docker-compose up -d
```

### **3. 访问应用**

- 前端：http://localhost
- 后端 API：http://localhost:8080/api
- MySQL：localhost:3306

## 📋 多阶段构建说明

### **前端构建（Dockerfile.frontend）**

**阶段1：构建阶段**
- 基础镜像：`node:18-alpine`
- 操作：安装依赖、构建 React 应用
- 输出：`build/` 目录

**阶段2：运行阶段**
- 基础镜像：`nginx:alpine`
- 操作：复制构建产物、配置 Nginx
- 输出：运行 Nginx 服务

**优势**：
- 最终镜像只包含 Nginx + 静态文件（~25MB）
- 不包含 Node.js 和构建工具（节省 ~180MB）

### **后端构建（Dockerfile.backend）**

**阶段1：构建阶段**
- 基础镜像：`maven:3.9-eclipse-temurin-21`
- 操作：下载依赖、编译 Java 代码、打包 JAR
- 输出：`morphtesser-backend-0.0.1-SNAPSHOT.jar`

**阶段2：运行阶段**
- 基础镜像：`eclipse-temurin:21-jre`
- 操作：复制 JAR 文件、创建目录、设置用户
- 输出：运行 Java 应用

**优势**：
- 最终镜像只包含 JRE + JAR（~250MB）
- 不包含 Maven 和 JDK（节省 ~300MB）

## 🔧 配置说明

### **环境变量**

在 `docker-compose.yml` 中配置：

```yaml
environment:
  - SPRING_DATASOURCE_URL=jdbc:mysql://db:3306/morphtesserdb
  - SPRING_DATASOURCE_USERNAME=root
  - SPRING_DATASOURCE_PASSWORD=your_password
  - PYTHON_MODELING_API_URL=http://your-python-service:8000/swc2obj/
```

### **数据持久化**

数据卷挂载：
- `./uploads` → `/app/uploads`（上传文件）
- `./logs` → `/app/logs`（日志文件）
- `./data` → `/app/data`（数据文件）
- `mysql-data` → `/var/lib/mysql`（数据库）

### **Nginx 配置**

Nginx 配置文件：`docker/nginx.conf`

主要功能：
- 静态文件服务
- API 反向代理（`/api/` → `backend:8080/api/`）
- Gzip 压缩
- 静态资源缓存

## 📊 镜像大小对比

| 镜像 | 传统构建 | 多阶段构建 | 节省 |
|------|---------|-----------|------|
| 前端 | ~180MB | ~25MB | ~155MB |
| 后端 | ~550MB | ~250MB | ~300MB |
| **总计** | **~730MB** | **~275MB** | **~455MB** |

## 🛠️ 常用命令

### **构建**
```bash
# 构建所有服务
docker-compose build

# 构建特定服务
docker-compose build frontend
docker-compose build backend
```

### **运行**
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### **停止**
```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

### **导出镜像**
```bash
# 导出前端镜像
docker save morphtesser-frontend:latest -o frontend.tar

# 导出后端镜像
docker save morphtesser-backend:latest -o backend.tar
```

### **导入镜像**
```bash
# 导入镜像
docker load -i frontend.tar
docker load -i backend.tar
```

## 🔍 故障排查

### **前端无法访问后端 API**

检查 Nginx 配置中的 `proxy_pass` 是否正确：
```nginx
location /api/ {
    proxy_pass http://backend:8080/api/;
}
```

### **后端无法连接数据库**

检查 `docker-compose.yml` 中的数据库配置：
- 确保 `depends_on` 包含 `db`
- 确保数据库环境变量正确

### **构建失败**

1. **Maven 依赖下载失败**：
   - Dockerfile 中已配置阿里云镜像源
   - 检查网络连接

2. **npm 安装失败**：
   - 检查 `package.json` 是否正确
   - 尝试清除缓存：`docker system prune`

## 📝 生产环境部署

### **1. 修改配置**

编辑 `docker-compose.yml`：
- 修改数据库密码
- 配置域名和 SSL
- 调整资源限制

### **2. 构建生产镜像**

```bash
docker-compose -f docker-compose.yml build
```

### **3. 启动服务**

```bash
docker-compose -f docker-compose.yml up -d
```

### **4. 配置反向代理（可选）**

如果有外部 Nginx，可以移除前端服务，直接使用外部 Nginx。

## 🔐 安全建议

1. **使用非 root 用户运行容器**（后端已配置）
2. **使用强密码**（数据库、JWT 密钥）
3. **启用 HTTPS**（配置 SSL 证书）
4. **限制资源使用**（CPU、内存）
5. **定期更新镜像**（安全补丁）

## 📚 参考文档

- [Docker 多阶段构建](https://docs.docker.com/build/building/multi-stage/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Spring Boot Docker 指南](https://spring.io/guides/gs/spring-boot-docker/)

