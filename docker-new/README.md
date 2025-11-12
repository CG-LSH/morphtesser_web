# Docker 直连方案（docker-new）

此目录基于最新的前端默认地址 `http://localhost:34202`，构建前后端均监听 80 的镜像，可直接在本地或云端通过端口映射访问。

## 更多改动

- 前端 `axios.config.js` 默认指向 `http://localhost:34202`。可通过 `REACT_APP_API_BASE_URL` 在构建或运行时覆盖。
- `Dockerfile.frontend` 支持 `ARG REACT_APP_API_BASE_URL`，`docker-compose.yml` 已传递默认值。
- 镜像标签使用 `202511101355`，便于与旧版本区分。

## 构建

```powershell
cd C:\Users\15370\Morphtesser_Web
docker compose -f docker-new\docker-compose.yml build
```

生成镜像：

- `morphtesser-frontend:202511101355`
- `morphtesser-backend:202511101355`

## 启动

```powershell
docker compose -f docker-new\docker-compose.yml up -d
```

访问地址：

- 前端：`http://localhost:34080/`
- 后端 API：`http://localhost:34202/`

## 导出镜像（如需）

```powershell
docker save -o morphtesser-frontend-202511101355.tar morphtesser-frontend:202511101355
docker save -o morphtesser-backend-202511101355.tar morphtesser-backend:202511101355
```

## 注意事项

- 如在线建模依赖的 Python 服务不在本机，请在 `docker-new/docker-compose.yml` 中调整 `PYTHON_MODELING_API_URL`。
- 数据集、上传等目录仍通过挂载方式提供，必要时修改对应卷路径或环境变量。 

