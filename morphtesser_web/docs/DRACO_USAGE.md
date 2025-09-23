# Draco压缩功能使用说明

## 功能概述

本系统已集成Draco压缩功能，可以将大型OBJ文件（>20MB）压缩为Draco格式（.drc），显著提升传输速度和渲染性能。

## 压缩效果

- **压缩率**: 75-90%（20MB → 2-5MB）
- **传输速度提升**: 4-10倍
- **渲染性能提升**: 1.5-3倍
- **内存使用减少**: 60-80%

## 后端实现

### 1. Python服务
- **文件**: `backend/python_service/draco_compressor.py`
- **功能**: OBJ文件压缩为Draco格式
- **API端点**: 
  - `POST /compress/` - 压缩OBJ文件
  - `POST /swc2obj_draco/` - SWC转OBJ并压缩

### 2. Java服务
- **文件**: `backend/src/main/java/com/morphtesser/service/impl/ModelServiceImpl.java`
- **功能**: 自动生成Draco文件
- **数据库字段**: 
  - `draco_file_path` - Draco文件路径
  - `compression_ratio` - 压缩比率

## 前端实现

### 1. 模型查看器
- **文件**: `frontend/src/components/ModelViewer.js`
- **功能**: 自动检测并加载Draco文件
- **支持格式**: OBJ, Draco (.drc)

### 2. 文件服务
- **文件**: `frontend/src/services/model.service.js`
- **功能**: Draco文件下载和访问
- **API**: 
  - `getDracoFileUrl(id)` - 获取Draco文件URL
  - `downloadDracoFile(id)` - 下载Draco文件

## 使用流程

### 1. 自动压缩
当用户上传SWC文件时，系统会：
1. 转换为OBJ文件
2. 自动压缩为Draco格式
3. 保存压缩文件路径和压缩比率

### 2. 前端加载
前端会优先尝试加载Draco文件：
1. 检查模型是否有Draco文件
2. 如果有，使用Draco加载器
3. 如果没有，回退到OBJ加载器

### 3. 手动压缩
可以通过API手动压缩现有OBJ文件：
```bash
curl -X POST http://localhost:8000/compress/ \
  -F "file=@model.obj" \
  -F "compression_level=7" \
  -F "quantization_bits=10"
```

## 配置参数

### 压缩参数
- **compression_level**: 0-10（默认7）
- **quantization_bits**: 1-31（默认10）
- **position_bits**: 位置精度（默认10）
- **normal_bits**: 法向量精度（默认8）

### 推荐配置
```python
# 高质量压缩
compression_level = 7
quantization_bits = 10

# 高压缩率
compression_level = 10
quantization_bits = 8

# 平衡配置
compression_level = 8
quantization_bits = 9
```

## 性能监控

### 压缩统计
- 原始文件大小
- 压缩后文件大小
- 压缩比率
- 压缩时间

### 加载性能
- 文件传输时间
- 解压时间
- 渲染帧率
- 内存使用

## 故障排除

### 常见问题

1. **Draco解码器加载失败**
   - 检查 `/public/draco/` 目录是否存在
   - 验证解码器文件是否完整
   - 检查网络连接

2. **压缩失败**
   - 检查Python服务是否运行
   - 验证OBJ文件格式是否正确
   - 检查磁盘空间是否充足

3. **性能问题**
   - 调整压缩参数
   - 检查网络带宽
   - 优化服务器配置

### 调试命令

```bash
# 检查Python服务状态
curl http://localhost:8000/health

# 测试压缩功能
curl -X POST http://localhost:8000/compress/ \
  -F "file=@test.obj" \
  -F "compression_level=7"

# 检查Draco文件
ls -la public/draco/
```

## 部署注意事项

1. **Draco解码器文件**
   - 确保解码器文件正确部署
   - 配置正确的MIME类型
   - 考虑使用CDN加速

2. **服务器配置**
   - 增加文件上传大小限制
   - 配置超时时间
   - 优化内存使用

3. **监控和日志**
   - 监控压缩成功率
   - 记录性能指标
   - 设置告警机制

## 未来优化

1. **渐进式加载**
   - 低精度预览
   - 按需加载细节
   - 流式传输

2. **智能压缩**
   - 自适应压缩参数
   - 基于网络状况调整
   - 用户偏好学习

3. **缓存策略**
   - 浏览器缓存优化
   - CDN分发
   - 预压缩常用模型 