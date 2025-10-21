# MorphTesser 群晖 NAS + Docker 部署指南

## 📋 项目架构
- **前端**: React 18 + Material-UI + Three.js
- **后端**: Spring Boot 3.2.3 (Java 21) + MySQL
- **Python 服务**: FastAPI + Draco 压缩
- **部署方式**: 群晖 NAS + Docker 容器化
- **目标**: 现代化、可扩展、易维护的部署方案

---

## 一、域名注册与配置

### 1.1 域名注册
1. **选择域名注册商**（任选其一）
   - 阿里云万网：https://wanwang.aliyun.com
   - 腾讯云 DNSPod：https://dnspod.cloud.tencent.com
   - GoDaddy：https://www.godaddy.com
   - Namecheap：https://www.namecheap.com

2. **注册域名**
   ```
   建议域名格式：
   - morphtesser.com
   - morphtesser.net
   - morphtesser.xyz
   ```

3. **完成实名认证**（国内注册商必须）
   - 上传身份证/营业执照
   - 等待审核（1-3 天）

### 1.2 DNS 配置
1. **获取公网 IP**
   - 登录群晖 DSM → 控制面板 → 外部访问 → DDNS
   - 记录当前公网 IP（如 `123.45.67.89`）
   - 如无公网 IP，联系 ISP 申请或使用内网穿透

2. **添加 DNS 记录**
   ```
   类型    主机记录    记录值
   A       @          123.45.67.89  (主域名)
   A       www        123.45.67.89  (www 子域名)
   CNAME   api        @             (API 接口)
   ```

3. **配置群晖 DDNS**（可选，动态 IP 用户）
   - 控制面板 → 外部访问 → DDNS
   - 选择服务商并配置自动更新

---

## 二、群晖 NAS 环境准备

### 2.1 安装必需软件包
**通过套件中心安装：**
1. **Container Manager**（原 Docker）
   - 套件中心 → 搜索 "Container Manager" → 安装
   - 这是 Docker 容器化的核心组件

2. **Web Station**（可选，用于 SSL 证书管理）
   - 套件中心 → 搜索 "Web Station" → 安装

### 2.2 创建项目目录
1. **控制面板 → 共享文件夹 → 新增**
   ```
   名称: morphtesser
   位置: /volume1/morphtesser
   ```

2. **创建 Docker 项目结构**
   ```bash
   # SSH 登录 NAS
   ssh admin@nas-ip
   
   # 创建项目目录
   mkdir -p /volume1/morphtesser/{backend,frontend,python_service,nginx,ssl,logs,uploads}
   ```

3. **目录结构**
   ```
   morphtesser/
   ├── docker-compose.yml
   ├── backend/
   │   ├── Dockerfile
   │   └── target/
   │       └── app.jar
   ├── frontend/
   │   ├── Dockerfile
   │   └── build/
   ├── python_service/
   │   ├── Dockerfile
   │   ├── requirements.txt
   │   └── app.py
   ├── nginx/
   │   └── nginx.conf
   ├── ssl/
   │   ├── cert.pem
   │   └── privkey.pem
   ├── logs/
   ├── uploads/
   └── database/
       └── init.sql
   ```

---

## 三、Docker 文件准备

### 3.1 后端 Dockerfile
**创建 `/volume1/morphtesser/backend/Dockerfile`：**
```dockerfile
FROM openjdk:21-jre-slim

# 设置工作目录
WORKDIR /app

# 复制 JAR 文件
COPY target/morphtesser-backend-0.0.1-SNAPSHOT.jar app.jar

# 创建必要目录
RUN mkdir -p /app/uploads /app/logs

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["java", "-Xmx2G", "-Xms512M", "-jar", "app.jar"]
```

### 3.2 前端 Dockerfile
**创建 `/volume1/morphtesser/frontend/Dockerfile`：**
```dockerfile
FROM nginx:alpine

# 复制构建文件
COPY build/ /usr/share/nginx/html/

# 复制 Nginx 配置
COPY ../nginx/nginx.conf /etc/nginx/nginx.conf

# 创建必要目录
RUN mkdir -p /usr/share/nginx/html/uploads

# 暴露端口
EXPOSE 80 443

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 3.3 Python 服务 Dockerfile
**创建 `/volume1/morphtesser/python_service/Dockerfile`：**
```dockerfile
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用文件
COPY . .

# 创建必要目录
RUN mkdir -p /app/uploads

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["python", "app.py"]
```

### 3.4 Python 依赖文件
**创建 `/volume1/morphtesser/python_service/requirements.txt`：**
```
fastapi==0.104.1
uvicorn==0.24.0
draco3d==1.5.7
numpy==1.24.3
python-multipart==0.0.6
```

---

## 四、Docker Compose 配置

### 4.1 主配置文件
**创建 `/volume1/morphtesser/docker-compose.yml`：**
```yaml
version: '3.8'

services:
  # 数据库服务
  db:
    image: mysql:8.0
    container_name: morphtesser-db
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: morphtesserdb
      MYSQL_USER: morphtesser
      MYSQL_PASSWORD: your_password_here
      MYSQL_CHARACTER_SET_SERVER: utf8mb4
      MYSQL_COLLATION_SERVER: utf8mb4_unicode_ci
    volumes:
      - db_data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"
    restart: unless-stopped
    networks:
      - morphtesser-network

  # 后端服务
  backend:
    build: ./backend
    container_name: morphtesser-backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://db:3306/morphtesserdb?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
      SPRING_DATASOURCE_USERNAME: morphtesser
      SPRING_DATASOURCE_PASSWORD: your_password_here
      SPRING_PROFILES_ACTIVE: prod
      PYTHON_SERVICE_URL: http://python:5000
      FILE_UPLOAD_DIR: /app/uploads
    volumes:
      - uploads:/app/uploads
      - logs:/app/logs
    depends_on:
      - db
    restart: unless-stopped
    networks:
      - morphtesser-network

  # Python 服务
  python:
    build: ./python_service
    container_name: morphtesser-python
    ports:
      - "5000:5000"
    volumes:
      - uploads:/app/uploads
    depends_on:
      - db
    restart: unless-stopped
    networks:
      - morphtesser-network

  # 前端服务
  frontend:
    build: ./frontend
    container_name: morphtesser-frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - uploads:/usr/share/nginx/html/uploads
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - morphtesser-network

# 数据卷
volumes:
  db_data:
    driver: local
  uploads:
    driver: local
  logs:
    driver: local

# 网络
networks:
  morphtesser-network:
    driver: bridge
```

---

## 五、Nginx 配置

### 5.1 Nginx 配置文件
**创建 `/volume1/morphtesser/nginx/nginx.conf`：**
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 上传文件大小限制
    client_max_body_size 100M;

    # HTTP 重定向到 HTTPS
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS 配置
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL 证书配置
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        
        # SSL 安全配置
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        
        # 安全头
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # 前端静态文件
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            
            # 缓存静态资源
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|drc|obj)$ {
                expires 30d;
                add_header Cache-Control "public, immutable";
            }
        }

        # 后端 API 代理
        location /api/ {
            proxy_pass http://backend:8080/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # 超时设置
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
            
            # WebSocket 支持
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # 文件上传和下载
        location /uploads/ {
            alias /usr/share/nginx/html/uploads/;
            autoindex off;
            
            # 文件类型
            location ~* \.(swc|obj|drc)$ {
                add_header Content-Disposition "attachment";
            }
        }

        # Python 服务代理（如果需要）
        location /python/ {
            proxy_pass http://python:5000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

---

## 六、数据库初始化

### 6.1 数据库初始化脚本
**创建 `/volume1/morphtesser/database/init.sql`：**
```sql
-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS morphtesserdb 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE morphtesserdb;

-- 创建用户表（如果需要用户功能）
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建神经元模型表
CREATE TABLE IF NOT EXISTS neuron_models (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    species VARCHAR(100),
    brain_region VARCHAR(100),
    file_type VARCHAR(50),
    file_path VARCHAR(500),
    obj_path VARCHAR(500),
    draco_file_path VARCHAR(500),
    compression_ratio DOUBLE,
    preview_image_path VARCHAR(500),
    is_public BOOLEAN DEFAULT TRUE,
    user_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_id ON neuron_models(user_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON neuron_models(created_at);
CREATE INDEX IF NOT EXISTS idx_is_public ON neuron_models(is_public);
```

---

## 七、SSL 证书配置

### 7.1 申请 Let's Encrypt 证书
1. **使用群晖 DSM 申请证书**
   ```
   DSM → 控制面板 → 安全性 → 证书 → 新增 → Let's Encrypt
   域名: yourdomain.com
   备用域名: www.yourdomain.com
   邮箱: your-email@example.com
   ```

2. **复制证书文件**
   ```bash
   # SSH 登录 NAS
   ssh admin@nas-ip
   
   # 查找证书文件
   find /usr/syno/etc/certificate/_archive -name "*.pem" | grep yourdomain.com
   
   # 复制证书到项目目录
   cp /usr/syno/etc/certificate/_archive/xxx/cert.pem /volume1/morphtesser/ssl/
   cp /usr/syno/etc/certificate/_archive/xxx/privkey.pem /volume1/morphtesser/ssl/
   ```

### 7.2 证书自动更新
**创建证书更新脚本 `/volume1/morphtesser/scripts/update_ssl.sh`：**
```bash
#!/bin/bash

# 更新证书
certbot renew --quiet

# 检查是否更新成功
if [ $? -eq 0 ]; then
    echo "[$(date)] SSL certificate updated successfully"
    
    # 复制新证书
    cp /usr/syno/etc/certificate/_archive/xxx/cert.pem /volume1/morphtesser/ssl/
    cp /usr/syno/etc/certificate/_archive/xxx/privkey.pem /volume1/morphtesser/ssl/
    
    # 重启前端容器
    cd /volume1/morphtesser
    docker-compose restart frontend
    
    echo "[$(date)] Frontend container restarted"
else
    echo "[$(date)] SSL certificate update failed"
fi
```

---

## 八、项目构建与部署

### 8.1 后端构建
**在开发机器上：**
```bash
cd morphtesser_web/backend

# 修改配置文件
vim src/main/resources/application.properties
```

**关键配置：**
```properties
# 数据库连接
spring.datasource.url=jdbc:mysql://db:3306/morphtesserdb
spring.datasource.username=morphtesser
spring.datasource.password=your_password_here

# 文件上传路径
file.upload-dir=/app/uploads

# Python 服务地址
python.service.url=http://python:5000

# 生产环境配置
spring.profiles.active=prod
logging.level.com.morphtesser=INFO
```

**打包：**
```bash
mvn clean package -DskipTests
```

### 8.2 前端构建
**在开发机器上：**
```bash
cd morphtesser_web/frontend

# 修改 API 地址
vim src/services/axios.config.js
```

**修改 baseURL：**
```javascript
baseURL: 'https://yourdomain.com/api'
```

**构建：**
```bash
npm run build
```

### 8.3 上传到 NAS
```bash
# 上传后端 JAR 文件
scp target/morphtesser-backend-0.0.1-SNAPSHOT.jar \
    admin@nas-ip:/volume1/morphtesser/backend/target/app.jar

# 上传前端构建文件
scp -r build/* admin@nas-ip:/volume1/morphtesser/frontend/build/

# 上传 Python 服务
scp -r python_service/* admin@nas-ip:/volume1/morphtesser/python_service/
```

---

## 九、Docker 服务启动

### 9.1 构建和启动服务
```bash
# SSH 登录 NAS
ssh admin@nas-ip

# 进入项目目录
cd /volume1/morphtesser

# 构建所有镜像
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 9.2 查看服务日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f python
docker-compose logs -f db
```

### 9.3 服务管理命令
```bash
# 停止所有服务
docker-compose down

# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend

# 查看服务状态
docker-compose ps

# 进入容器
docker-compose exec backend bash
docker-compose exec db mysql -u root -p
```

---

## 十、防火墙与端口转发

### 10.1 群晖防火墙配置
**控制面板 → 安全性 → 防火墙：**
```
端口    协议    来源         动作
80      TCP    所有        允许
443     TCP    所有        允许
8080    TCP    仅本地      允许
3306    TCP    仅本地      允许
5000    TCP    仅本地      允许
```

### 10.2 路由器端口转发
**路由器管理界面：**
```
外部端口    内部端口    内部 IP       协议
80          80          NAS_IP       TCP
443         443         NAS_IP       TCP
```

---

## 十一、自动启动配置

### 11.1 创建启动脚本
**创建 `/volume1/morphtesser/scripts/start.sh`：**
```bash
#!/bin/bash

cd /volume1/morphtesser

# 启动所有服务
docker-compose up -d

# 等待服务启动
sleep 30

# 检查服务状态
docker-compose ps

echo "[$(date)] MorphTesser services started"
```

### 11.2 创建停止脚本
**创建 `/volume1/morphtesser/scripts/stop.sh`：**
```bash
#!/bin/bash

cd /volume1/morphtesser

# 停止所有服务
docker-compose down

echo "[$(date)] MorphTesser services stopped"
```

### 11.3 配置开机自启
**任务计划：**
1. **控制面板 → 任务计划 → 新增 → 触发的任务 → 用户定义的脚本**
2. **常规设置：**
   ```
   任务名称: MorphTesser Docker Services
   用户: root
   事件: 开机
   ```
3. **任务设置 → 用户定义的脚本：**
   ```bash
   /volume1/morphtesser/scripts/start.sh
   ```

---

## 十二、监控与维护

### 12.1 服务监控脚本
**创建 `/volume1/morphtesser/scripts/monitor.sh`：**
```bash
#!/bin/bash

cd /volume1/morphtesser

# 检查服务状态
if ! docker-compose ps | grep -q "Up"; then
    echo "[$(date)] Services not running, restarting..."
    docker-compose up -d
fi

# 检查磁盘空间
DISK_USAGE=$(df /volume1 | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "[$(date)] Disk usage high: ${DISK_USAGE}%"
fi

# 检查内存使用
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 90 ]; then
    echo "[$(date)] Memory usage high: ${MEMORY_USAGE}%"
fi
```

### 12.2 日志管理
```bash
# 清理旧日志
docker system prune -f

# 清理特定容器日志
docker-compose logs --tail=1000 backend > /volume1/morphtesser/logs/backend.log
docker-compose logs --tail=1000 frontend > /volume1/morphtesser/logs/frontend.log
```

### 12.3 数据备份
**创建备份脚本 `/volume1/morphtesser/scripts/backup.sh`：**
```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/volume1/morphtesser/backups"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose exec -T db mysqldump -u root -prootpassword morphtesserdb > $BACKUP_DIR/db_$DATE.sql

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /volume1/morphtesser/uploads/

# 清理旧备份（保留最近 7 天）
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "[$(date)] Backup completed: $DATE"
```

---

## 十三、测试与验证

### 13.1 服务测试
```bash
# 测试数据库连接
docker-compose exec db mysql -u morphtesser -p morphtesserdb -e "SELECT 1;"

# 测试后端 API
curl http://localhost:8080/api/health

# 测试前端
curl http://localhost:80

# 测试 HTTPS
curl -k https://localhost:443
```

### 13.2 功能测试
1. **访问网站**
   ```
   浏览器访问: https://yourdomain.com
   ```

2. **测试功能**
   - 用户注册/登录
   - 文件上传
   - 在线建模
   - 数据库浏览
   - 3D 模型查看

### 13.3 性能测试
```bash
# 查看容器资源使用
docker stats

# 查看服务响应时间
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/api/health
```

---

## 十四、故障排查

### 14.1 常见问题

**问题1：容器无法启动**
```bash
# 查看容器日志
docker-compose logs backend

# 检查端口占用
netstat -tuln | grep 8080

# 检查镜像构建
docker-compose build --no-cache backend
```

**问题2：数据库连接失败**
```bash
# 检查数据库状态
docker-compose exec db mysql -u root -p -e "SHOW DATABASES;"

# 检查网络连接
docker-compose exec backend ping db
```

**问题3：SSL 证书问题**
```bash
# 检查证书文件
ls -la /volume1/morphtesser/ssl/

# 测试证书有效性
openssl x509 -in /volume1/morphtesser/ssl/cert.pem -text -noout
```

### 14.2 日志分析
```bash
# 实时查看所有日志
docker-compose logs -f

# 查看特定时间段的日志
docker-compose logs --since="2024-01-01T00:00:00" backend

# 导出日志
docker-compose logs backend > backend.log
```

---

## 十五、性能优化

### 15.1 Docker 优化
```yaml
# docker-compose.yml 中添加资源限制
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
```

### 15.2 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_user_id ON neuron_models(user_id);
CREATE INDEX idx_created_at ON neuron_models(created_at);
CREATE INDEX idx_is_public ON neuron_models(is_public);
```

### 15.3 Nginx 优化
```nginx
# 启用缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|drc|obj)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# 启用 Gzip
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

---

## 📞 技术支持

- **官网**: https://yourdomain.com
- **文档**: https://docs.yourdomain.com
- **GitHub**: https://github.com/yourorg/morphtesser

---

## ✅ 部署检查清单

- [ ] 域名注册并完成 DNS 配置
- [ ] NAS 安装 Container Manager
- [ ] 创建项目目录结构
- [ ] 准备 Docker 文件
- [ ] 配置 Docker Compose
- [ ] 申请 SSL 证书
- [ ] 构建和上传应用文件
- [ ] 启动 Docker 服务
- [ ] 配置防火墙和端口转发
- [ ] 测试所有功能
- [ ] 配置自动启动和监控
- [ ] 设置备份策略

---

## 🎯 Docker 部署优势

### **相比直接部署的优势：**
- ✅ **环境隔离**：每个服务独立容器
- ✅ **版本管理**：Docker 镜像版本控制
- ✅ **易于迁移**：容器可移植
- ✅ **资源管理**：Docker 资源限制
- ✅ **服务编排**：Docker Compose 统一管理
- ✅ **备份恢复**：容器快照和恢复
- ✅ **扩展性**：支持多容器部署
- ✅ **一致性**：开发和生产环境一致

### **部署时间：**
- **首次部署**: 2-3 小时
- **更新部署**: 10-15 分钟
- **回滚部署**: 5 分钟

### **建议 NAS 配置：**
- **CPU**: 4核+
- **内存**: 8GB+
- **存储**: 500GB+
- **网络**: 千兆以太网

---

**预计部署时间**: 2-3 小时（首次部署）  
**维护复杂度**: 低（Docker 自动化管理）  
**扩展性**: 高（支持多容器部署）
