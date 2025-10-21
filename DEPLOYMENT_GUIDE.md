# MorphTesser 群晖 NAS 部署指南

## 📋 项目架构
- **前端**: React 18 + Material-UI + Three.js
- **后端**: Spring Boot 3.2.3 (Java 21) + MySQL
- **Python 服务**: FastAPI + Draco 压缩
- **部署目标**: 群晖 NAS (DSM 7.x)

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
   - yourdomain.com
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

2. **Web Station**
   - 套件中心 → 搜索 "Web Station" → 安装

3. **MariaDB 10/MySQL**
   - 套件中心 → 搜索 "MariaDB 10" → 安装
   - 设置 root 密码（记录备用）

### 2.2 创建共享文件夹
1. **控制面板 → 共享文件夹 → 新增**
   ```
   名称: morphtesser
   位置: /volume1/morphtesser
   ```

2. **创建子目录结构**
   ```
   morphtesser/
   ├── backend/          # 后端 JAR 包
   ├── frontend/         # 前端构建文件
   ├── uploads/          # 上传文件存储
   ├── logs/            # 日志文件
   └── scripts/         # Python 脚本
   ```

### 2.3 配置 Java 环境
1. **SSH 登录 NAS**
   ```bash
   ssh admin@nas-ip
   ```

2. **安装 OpenJDK 21**
   ```bash
   # 使用 SynoCommunity 源
   sudo synopkg install Java21
   # 或手动下载 JDK 21 到 /usr/local/java
   ```

3. **验证安装**
   ```bash
   java -version  # 应显示 openjdk version "21.x.x"
   ```

### 2.4 配置 Python 环境
1. **安装 Python 3**（套件中心）
   - 搜索 "Python 3.11" → 安装

2. **安装依赖库**
   ```bash
   pip3 install fastapi uvicorn draco numpy
   ```

---

## 三、数据库配置

### 3.1 创建数据库
1. **访问 phpMyAdmin**
   ```
   http://nas-ip:port/phpMyAdmin
   用户: root
   密码: (安装时设置的密码)
   ```

2. **创建数据库**
   ```sql
   CREATE DATABASE morphtesserdb 
   CHARACTER SET utf8mb4 
   COLLATE utf8mb4_unicode_ci;
   ```

3. **创建应用用户**（可选）
   ```sql
   CREATE USER 'morphtesser'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON morphtesserdb.* TO 'morphtesser'@'localhost';
   FLUSH PRIVILEGES;
   ```

### 3.2 数据库配置优化
**编辑 MariaDB 配置：**
```bash
sudo vi /var/packages/MariaDB10/etc/my.cnf
```

添加：
```ini
[mysqld]
max_connections = 500
max_allowed_packet = 100M
innodb_buffer_pool_size = 1G
```

重启 MariaDB：
```bash
sudo synopkg restart MariaDB10
```

---

## 四、后端部署

### 4.1 打包后端应用
**在开发机器上：**
```bash
cd morphtesser_web/backend

# 修改 application.properties
vim src/main/resources/application.properties
```

**关键配置：**
```properties
# 数据库连接（改为 NAS 地址）
spring.datasource.url=jdbc:mysql://localhost:3306/morphtesserdb
spring.datasource.username=morphtesser
spring.datasource.password=your_password

# 文件上传路径（改为 NAS 路径）
file.upload-dir=/volume1/morphtesser/uploads

# Python 服务地址
python.service.url=http://localhost:5000

# 生产环境日志级别
logging.level.com.morphtesser=INFO
```

**打包：**
```bash
mvn clean package -DskipTests
```

生成：`target/morphtesser-backend-0.0.1-SNAPSHOT.jar`

### 4.2 上传到 NAS
```bash
scp target/morphtesser-backend-0.0.1-SNAPSHOT.jar \
    admin@nas-ip:/volume1/morphtesser/backend/app.jar
```

### 4.3 创建启动脚本
**SSH 登录 NAS 后：**
```bash
cd /volume1/morphtesser/backend
vim start.sh
```

```bash
#!/bin/bash
export JAVA_HOME=/usr/local/java
export PATH=$JAVA_HOME/bin:$PATH

nohup java -Xmx2G -Xms512M \
  -Dspring.profiles.active=prod \
  -jar /volume1/morphtesser/backend/app.jar \
  > /volume1/morphtesser/logs/backend.log 2>&1 &

echo $! > /volume1/morphtesser/backend/app.pid
```

```bash
chmod +x start.sh
```

### 4.4 创建停止脚本
```bash
vim stop.sh
```

```bash
#!/bin/bash
PID_FILE=/volume1/morphtesser/backend/app.pid
if [ -f $PID_FILE ]; then
  PID=$(cat $PID_FILE)
  kill $PID
  rm $PID_FILE
  echo "Backend stopped (PID: $PID)"
else
  echo "No PID file found"
fi
```

```bash
chmod +x stop.sh
```

---

## 五、Python 服务部署

### 5.1 上传 Python 脚本
```bash
scp -r morphtesser_web/backend/python_service/* \
    admin@nas-ip:/volume1/morphtesser/scripts/
```

### 5.2 创建启动脚本
```bash
cd /volume1/morphtesser/scripts
vim start_python.sh
```

```bash
#!/bin/bash
cd /volume1/morphtesser/scripts
nohup python3 app.py \
  > /volume1/morphtesser/logs/python.log 2>&1 &

echo $! > /volume1/morphtesser/scripts/python.pid
```

```bash
chmod +x start_python.sh
```

---

## 六、前端部署

### 6.1 构建前端
**在开发机器上：**
```bash
cd morphtesser_web/frontend

# 修改 API 地址
vim src/services/axios.config.js
```

**修改 baseURL：**
```javascript
baseURL: 'https://yourdomain.com/api'  // 改为你的域名
```

**构建：**
```bash
npm run build
```

生成：`build/` 目录

### 6.2 上传到 NAS
```bash
scp -r build/* admin@nas-ip:/volume1/morphtesser/frontend/
```

### 6.3 配置 Web Station
1. **打开 Web Station**
2. **Web 服务门户 → 创建**
   ```
   门户类型: 基于名称的虚拟主机
   主机名: yourdomain.com
   端口: HTTP 80, HTTPS 443
   文档根目录: /volume1/morphtesser/frontend
   ```

3. **启用 HTTPS**
   - 证书 → Let's Encrypt → 添加证书
   - 域名: yourdomain.com
   - 主体替代名称: www.yourdomain.com

---

## 七、Nginx 反向代理配置

### 7.1 安装 Nginx（可选）
如果 Web Station 不满足需求：
```bash
sudo apt-get install nginx  # DSM 7.x
```

### 7.2 配置反向代理
```bash
sudo vim /etc/nginx/sites-available/morphtesser
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /usr/syno/etc/certificate/_archive/xxx/cert.pem;
    ssl_certificate_key /usr/syno/etc/certificate/_archive/xxx/privkey.pem;

    # 前端静态文件
    location / {
        root /volume1/morphtesser/frontend;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 文件上传
    location /uploads/ {
        alias /volume1/morphtesser/uploads/;
        autoindex off;
    }

    # 大文件上传
    client_max_body_size 100M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/morphtesser /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 八、配置自动启动

### 8.1 创建系统服务
**任务计划：**
1. **控制面板 → 任务计划 → 新增 → 触发的任务 → 用户定义的脚本**
2. **常规设置：**
   ```
   任务名称: MorphTesser Backend
   用户: root
   事件: 开机
   ```

3. **任务设置 → 用户定义的脚本：**
   ```bash
   /volume1/morphtesser/backend/start.sh
   sleep 10
   /volume1/morphtesser/scripts/start_python.sh
   ```

### 8.2 创建监控脚本（可选）
```bash
vim /volume1/morphtesser/monitor.sh
```

```bash
#!/bin/bash
# 检查后端
if ! pgrep -f "app.jar" > /dev/null; then
  /volume1/morphtesser/backend/start.sh
  echo "[$(date)] Backend restarted" >> /volume1/morphtesser/logs/monitor.log
fi

# 检查 Python
if ! pgrep -f "app.py" > /dev/null; then
  /volume1/morphtesser/scripts/start_python.sh
  echo "[$(date)] Python service restarted" >> /volume1/morphtesser/logs/monitor.log
fi
```

**添加 cron 任务：**
```bash
*/5 * * * * /volume1/morphtesser/monitor.sh
```

---

## 九、防火墙与安全配置

### 9.1 配置防火墙规则
**控制面板 → 安全性 → 防火墙：**
```
端口    协议    来源         动作
80      TCP    所有        允许
443     TCP    所有        允许
8080    TCP    仅本地      允许
3306    TCP    仅本地      允许
5000    TCP    仅本地      允许
```

### 9.2 配置路由器端口转发
**路由器管理界面：**
```
外部端口    内部端口    内部 IP       协议
80          80          NAS_IP       TCP
443         443         NAS_IP       TCP
```

### 9.3 安全加固
1. **修改 SSH 端口**
   - 控制面板 → 终端机 & SNMP → 更改 SSH 端口

2. **启用自动封锁**
   - 控制面板 → 安全性 → 自动封锁

3. **定期备份**
   - Hyper Backup → 创建备份任务

---

## 十、启动与测试

### 10.1 启动服务
```bash
# SSH 登录 NAS
ssh admin@nas-ip

# 启动后端
cd /volume1/morphtesser/backend
./start.sh

# 启动 Python 服务
cd /volume1/morphtesser/scripts
./start_python.sh

# 查看日志
tail -f /volume1/morphtesser/logs/backend.log
tail -f /volume1/morphtesser/logs/python.log
```

### 10.2 测试访问
1. **测试后端 API**
   ```bash
   curl http://nas-ip:8080/api/health
   ```

2. **测试前端**
   ```
   浏览器访问: https://yourdomain.com
   ```

3. **测试功能**
   - 用户注册/登录
   - 文件上传
   - 在线建模
   - 数据库浏览

---

## 十一、性能优化

### 11.1 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_user_id ON neuron_models(user_id);
CREATE INDEX idx_created_at ON neuron_models(created_at);
```

### 11.2 文件缓存
**Nginx 配置：**
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|drc|obj)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 11.3 Draco 压缩优化
**调整压缩参数：**
```java
// ModelServiceImpl.java
compression_level = 7   // 平衡压缩率和速度
quantization_bits = 14  // qp14 适中质量
```

---

## 十二、日常维护

### 12.1 日志管理
```bash
# 定期清理日志（保留最近 30 天）
find /volume1/morphtesser/logs -name "*.log" -mtime +30 -delete
```

### 12.2 数据库备份
```bash
# 创建备份脚本
vim /volume1/morphtesser/backup_db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p'password' morphtesserdb \
  > /volume1/morphtesser/backup/db_$DATE.sql
```

### 12.3 监控告警
**使用群晖监控中心：**
- CPU 使用率 > 80%
- 内存使用率 > 90%
- 磁盘使用率 > 85%

---

## 十三、故障排查

### 13.1 后端无法启动
```bash
# 检查端口占用
netstat -tuln | grep 8080

# 检查日志
tail -100 /volume1/morphtesser/logs/backend.log

# 检查 Java 版本
java -version
```

### 13.2 数据库连接失败
```bash
# 测试连接
mysql -u morphtesser -p morphtesserdb

# 检查防火墙
sudo iptables -L
```

### 13.3 前端页面空白
```bash
# 检查 Nginx 配置
sudo nginx -t

# 查看错误日志
tail -50 /var/log/nginx/error.log
```

---

## 📞 技术支持

- **官网**: https://yourdomain.com
- **文档**: https://docs.yourdomain.com
- **GitHub**: https://github.com/yourorg/morphtesser

---

## ✅ 部署检查清单

- [ ] 域名注册并完成 DNS 配置
- [ ] NAS 安装 Java 21、Python 3、MariaDB
- [ ] 创建数据库和用户
- [ ] 后端打包并上传 NAS
- [ ] Python 服务部署
- [ ] 前端构建并配置 Web Station
- [ ] 配置 Nginx 反向代理
- [ ] 配置 SSL 证书
- [ ] 配置防火墙和路由器
- [ ] 测试所有功能
- [ ] 配置自动启动和监控
- [ ] 设置定期备份

---

**预计部署时间**: 4-6 小时（首次部署）  
**建议 NAS 配置**: CPU 4核+, 内存 8GB+, 存储 500GB+

