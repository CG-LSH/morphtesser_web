# Draco解码器文件说明

## 文件结构
```
public/
  draco/
    draco_decoder.js
    draco_decoder.wasm
    draco_encoder.js
    draco_encoder.wasm
    draco_wasm_wrapper.js
```

## 下载链接

### 官方Draco解码器文件
- **draco_decoder.js**: https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_decoder.js
- **draco_decoder.wasm**: https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_decoder.wasm
- **draco_encoder.js**: https://www.gstatic.com/draco/versioned/encoders/1.5.6/draco_encoder.js
- **draco_encoder.wasm**: https://www.gstatic.com/draco/versioned/encoders/1.5.6/draco_encoder.wasm
- **draco_wasm_wrapper.js**: https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_wasm_wrapper.js

### Three.js Draco解码器
- **draco_decoder.js**: https://unpkg.com/three@0.158.0/examples/jsm/libs/draco/draco_decoder.js
- **draco_decoder.wasm**: https://unpkg.com/three@0.158.0/examples/jsm/libs/draco/draco_decoder.wasm

## 安装步骤

1. 在 `public` 目录下创建 `draco` 文件夹
2. 下载上述文件到 `public/draco/` 目录
3. 确保文件权限正确

## 验证安装

访问以下URL验证文件是否正确放置：
- `http://localhost:3000/draco/draco_decoder.js`
- `http://localhost:3000/draco/draco_decoder.wasm`

## 注意事项

- Draco解码器文件较大（约1-2MB），建议使用CDN
- 确保服务器支持 `.wasm` 文件的MIME类型
- 在生产环境中，建议将Draco文件部署到CDN以提高加载速度 