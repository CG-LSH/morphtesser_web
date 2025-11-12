# Docker 直连

前端与后端容器均在内部监听 `80` 端口的方案，前端直接调用宿主机映射后的后端端口，无需经过 Nginx 代理。

## 目录结构

- `Dockerfile.frontend`：React 前端多阶段构建，最终容器使用 `serve` 在 `80` 端口提供静态页面。
- `Dockerfile.backend`：Spring Boot 后端多阶段构建，最终容器在 `80` 端口运行。
- `docker-compose.yml`：定义 `frontend`、`backend`、`db` 三个服务，宿主机端口分别映射为 `34080`、`34202`、`3308`。
- `database/init.sql`：MySQL 初始化脚本，包含基础表结构与默认管理员账号。
- `.dockerignore`：剔除无关文件，缩小构建上下文。

## 构建与运行

```powershell
cd C:\Users\15370\Morphtesser_Web
docker compose -f docker-build\docker-compose.yml build
docker compose -f docker-build\docker-compose.yml up -d
```

构建后会生成以下镜像：

- `morphtesser-frontend:202511101040`
- `morphtesser-backend:202511101040`

## 导出镜像

```powershell
docker save -o morphtesser-frontend-202511101040.tar morphtesser-frontend:202511101040
docker save -o morphtesser-backend-202511101040.tar morphtesser-backend:202511101040
```

## 访问说明

- 前端入口（宿主机端口）：`http://localhost:34080/`
- 后端 API（宿主机端口）：`http://localhost:34202/`

部署到云服务器后，可将 `localhost` 替换为域名或公网 IP，端口映射保持一致即可实现前后端直连。

