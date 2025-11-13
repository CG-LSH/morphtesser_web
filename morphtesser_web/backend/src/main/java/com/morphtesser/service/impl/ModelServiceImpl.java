package com.morphtesser.service.impl;

import com.morphtesser.model.NeuronModel;
import com.morphtesser.model.User;
import com.morphtesser.repository.ModelRepository;
import com.morphtesser.repository.UserRepository;
import com.morphtesser.security.JwtUtils;
import com.morphtesser.service.ModelService;
import com.morphtesser.service.PythonService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.HashMap;
import java.io.BufferedReader;
import java.io.InputStreamReader;

@Service
public class ModelServiceImpl implements ModelService {
    private static final Logger logger = LoggerFactory.getLogger(ModelServiceImpl.class);
    
    @Value("${dataset.upload.base-dir:/app/uploads}")
    private String datasetUploadBaseDir;

    private Path basePath() {
        return Paths.get(datasetUploadBaseDir).toAbsolutePath().normalize();
    }

    private Path resolveUploadPath(String... segments) {
        Path path = basePath();
        for (String segment : segments) {
            path = path.resolve(segment);
        }
        return path.normalize();
    }

    private Path resolveRelativePath(String relative) {
        return basePath().resolve(relative).normalize();
    }

    private String toRelative(Path path) {
        Path normalized = path.toAbsolutePath().normalize();
        Path base = basePath();
        try {
            return base.relativize(normalized).toString().replace("\\", "/");
        } catch (IllegalArgumentException ex) {
            logger.warn("Path {} is outside of base directory {}; storing absolute path", normalized, base);
            return normalized.toString().replace("\\", "/");
        }
    }
    
    @Autowired
    private ModelRepository modelRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @Autowired
    private PythonService pythonService;
    
    // Python建模API URL（支持内网穿透地址）
    @Value("${python.modeling.api.url:http://localhost:8000/swc2obj/}")
    private String pythonModelingApiUrl;

    // Draco压缩脚本配置
    @Value("${draco.compressor.python:python3}")
    private String dracoCompressorPython;

    @Value("${draco.compressor.script:/app/tools/draco_compressor.py}")
    private String dracoCompressorScript;
    
    // 在线建模临时文件目录（不保存到数据库）
    @Value("${dataset.online-modeling.temp-dir:./temp/online-modeling/}")
    private String onlineModelingTempDir;

    @Override
    public ResponseEntity<?> uploadModel(MultipartFile file, String name, String token) {
        try {
            // 1. 获取用户
            String username = jwtUtils.getUserNameFromJwtToken(token.replace("Bearer ", ""));
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
            Long userId = user.getId();

            // 2. 先保存模型对象获取modelId
            NeuronModel model = new NeuronModel();
            model.setName(name);
            model.setUser(user);
            model.setCreatedAt(new Date());
            // 可补充其他元数据
            NeuronModel savedModel = modelRepository.save(model);
            Long modelId = savedModel.getId();

            // 3. 构建目标目录
            Path targetDir = resolveUploadPath(String.valueOf(userId), String.valueOf(modelId));
            Files.createDirectories(targetDir);

            // 4. 保存文件
            String originalFileName = file.getOriginalFilename();
            String fileName = (originalFileName == null || originalFileName.isBlank())
                    ? "model-" + UUID.randomUUID() + ".swc"
                    : originalFileName;
            Path swcPath = targetDir.resolve(fileName);
            file.transferTo(swcPath.toFile());
            model.setFilePath(toRelative(swcPath));

            // 5. 如果是SWC，调用Python服务
            int dotIndex = fileName.lastIndexOf('.');
            String extension = dotIndex >= 0 ? fileName.substring(dotIndex) : "";
            if (extension.equalsIgnoreCase(".swc")) {
                Map<String, Object> result = pythonService.convertSwcToObj(swcPath.toString());
                // Python返回obj的绝对路径，转为相对路径
                String objAbsPath = (String) result.get("objPath");
                if (objAbsPath != null) {
                    String objRelPath = toRelative(Paths.get(objAbsPath));
                    model.setObjFilePath(objRelPath);
                }
                model.setLength((Double) result.get("length"));
                model.setSurfaceArea((Double) result.get("surfaceArea"));
                model.setVolume((Double) result.get("volume"));
                
                // TODO: 后续可以在这里添加Draco压缩步骤
                // 目前保持原有的SWC到OBJ转换流程
            }

            // 6. 再次保存模型
            modelRepository.save(model);

            return ResponseEntity.ok(model);

        } catch (Exception e) {
            logger.error("模型上传失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("上传失败: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<NeuronModel> getModelById(Long id, String token) {
        String username = getUsernameFromToken(token);
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        NeuronModel model = modelRepository.findById(id).orElse(null);
        if (model == null) {
            return ResponseEntity.notFound().build();
        }
        if (!model.getUser().getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(model);
    }

    @Override
    public ResponseEntity<List<NeuronModel>> getUserModels(String token) {
        String username = getUsernameFromToken(token);
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = getUserFromUsername(username);
        List<NeuronModel> models = modelRepository.findByUserOrderByCreatedAtDesc(user);
        return ResponseEntity.ok(models);
    }

    @Override
    public ResponseEntity<?> deleteModel(Long id, String token) {
        String username = getUsernameFromToken(token);
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("无效的令牌");
        }
        NeuronModel model = modelRepository.findById(id).orElse(null);
        if (model == null) {
            return ResponseEntity.notFound().build();
        }
        if (!model.getUser().getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("没有权限删除此模型");
        }
        try {
            // 删除文件（SWC/OBJ）
            if (model.getFilePath() != null) {
                Files.deleteIfExists(resolveRelativePath(model.getFilePath()));
            }
            if (model.getObjFilePath() != null) {
                Files.deleteIfExists(resolveRelativePath(model.getObjFilePath()));
            }
            modelRepository.delete(model);
            logger.info("模型删除成功: id={}, name={}, user={}", id, model.getName(), username);
            return ResponseEntity.ok("模型删除成功");
        } catch (IOException e) {
            logger.error("删除模型文件失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("删除文件失败: " + e.getMessage());
        }
    }

    @Override
    public ResponseEntity<Resource> getModelFile(Long id, String type, String token) {
        String username = getUsernameFromToken(token);
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        NeuronModel model = modelRepository.findById(id).orElse(null);
        if (model == null) {
            return ResponseEntity.notFound().build();
        }
        if (!model.getUser().getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        try {
            String relPath;
            if ("obj".equalsIgnoreCase(type)) {
                relPath = model.getObjFilePath();
            } else if ("swc".equalsIgnoreCase(type)) {
                relPath = model.getFilePath();
            } else if ("draco".equalsIgnoreCase(type)) {
                relPath = model.getDracoFilePath();
            } else {
                return ResponseEntity.badRequest().build();
            }
            if (relPath == null) return ResponseEntity.notFound().build();
            Path absPath = resolveRelativePath(relPath);
            Resource resource = new UrlResource(absPath.toUri());
            if (resource.exists()) {
                return ResponseEntity.ok(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("获取模型文件失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Override
    public ResponseEntity<?> createModelFromOnlineBuilder(String name, String type, String token, MultipartFile swcFile) {
        // 使用临时目录，不保存到数据库
        String sessionId = UUID.randomUUID().toString();
        
        // 规范化路径：如果是相对路径，转换为绝对路径（相对于项目根目录）
        Path tempDirPath = Paths.get(onlineModelingTempDir);
        if (!tempDirPath.isAbsolute()) {
            // 相对于项目根目录（backend目录的父目录）
            String projectRoot = System.getProperty("user.dir");
            // 如果在backend目录运行，需要回到项目根目录
            if (projectRoot.endsWith("backend")) {
                projectRoot = new File(projectRoot).getParent();
            }
            tempDirPath = Paths.get(projectRoot, onlineModelingTempDir);
        }
        
        Path sessionDirPath = tempDirPath.resolve(sessionId);
        String sessionDir = sessionDirPath.toString() + File.separator;
        File sessionDirFile = sessionDirPath.toFile();
        if (!sessionDirFile.exists()) {
            sessionDirFile.mkdirs();
        }
        
        try {
            // 保存SWC文件到临时目录
            String swcFileName = "input.swc";
            String swcFilePath = Paths.get(sessionDir, swcFileName).toString();
            swcFile.transferTo(new File(swcFilePath));
            // 调用FastAPI服务，获得OBJ（通过内网穿透访问本地主机的API）
            RestTemplate restTemplate = new RestTemplate();
            String url = pythonModelingApiUrl; 
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new FileSystemResource(swcFilePath));
            // 关键：根据 type 传递 result_type
            String resultType;
            if ("refine".equalsIgnoreCase(type)) {
                resultType = "refined";
            } else {
                // raw / fast / 默认都走 obj
                resultType = "obj";
            }
            body.add("result_type", resultType);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<byte[]> response = restTemplate.exchange(
                url, HttpMethod.POST, requestEntity, byte[].class);
            String objFileName = "refine".equals(type) ? "output_refined.obj" : "output.obj";
            String objFilePath = Paths.get(sessionDir, objFileName).toString();

            // 判定是否真正得到了 OBJ：避免将 JSON 错误写入 OBJ 导致 0 字节或极小文件
            MediaType responseContentType = response.getHeaders().getContentType();
            String contentType = responseContentType != null ? responseContentType.toString() : "";
            byte[] bodyBytes = response.getBody();
            boolean isJson = contentType.contains("application/json");
            boolean looksTooSmall = bodyBytes == null || bodyBytes.length < 200; // 小文件大概率不是有效OBJ

            boolean wroteObj = false;
            if (response.getStatusCode() == HttpStatus.OK && !isJson && !looksTooSmall) {
                Files.write(Paths.get(objFilePath), bodyBytes);
                wroteObj = true;
            }

            // refined 失败则回退 raw
            if (!wroteObj && "refine".equals(type)) {
                MultiValueMap<String, Object> body2 = new LinkedMultiValueMap<>();
                body2.add("file", new FileSystemResource(swcFilePath));
                body2.add("result_type", "obj");
                HttpEntity<MultiValueMap<String, Object>> req2 = new HttpEntity<>(body2, headers);
                ResponseEntity<byte[]> resp2 = restTemplate.exchange(url, HttpMethod.POST, req2, byte[].class);

                MediaType resp2ContentType = resp2.getHeaders().getContentType();
                String ct2 = resp2ContentType != null ? resp2ContentType.toString() : "";
                byte[] b2 = resp2.getBody();
                boolean json2 = ct2.contains("application/json");
                boolean small2 = b2 == null || b2.length < 200;
                // 覆盖为 raw 命名
                objFileName = "output.obj";
                objFilePath = Paths.get(sessionDir, objFileName).toString();
                if (resp2.getStatusCode() == HttpStatus.OK && !json2 && !small2) {
                    Files.write(Paths.get(objFilePath), b2);
                    wroteObj = true;
                }
            }

            if (!wroteObj) {
                throw new RuntimeException("Out of memory: OBJ file was not generated. Modeling failed.");
            }
            
            // 启用Draco压缩（使用 draco_encoder 二进制）
            String dracoFileName = objFileName.replace(".obj", ".drc");
            String dracoFilePath = Paths.get(sessionDir, dracoFileName).toString();
            
            runDracoCompressor(objFilePath, dracoFilePath, 7, 14);
            
            // 在线建模不保存到数据库，使用临时路径和会话ID
            String swcHttpPath = "/api/temp/online-modeling/" + sessionId + "/" + swcFileName;
            String objHttpPath = "/api/temp/online-modeling/" + sessionId + "/" + objFileName;
            String dracoHttpPath = null;
            
            // 检查Draco文件是否存在
            File dracoFile = new File(dracoFilePath);
            if (dracoFile.exists()) {
                dracoHttpPath = "/api/temp/online-modeling/" + sessionId + "/" + dracoFileName;
            }
            
            // 获取OBJ文件大小
            long objSize = 0L;
            File objFile = new File(objFilePath);
            if (objFile.exists()) {
                objSize = objFile.length();
            }
            
            logger.info("在线建模成功（临时文件）: sessionId={}, name={}, swcHttpPath={}, objHttpPath={}, dracoHttpPath={}", 
                sessionId, name, swcHttpPath, objHttpPath, dracoHttpPath);
            
            // 返回结果（不保存到数据库）
            Map<String, Object> result = new HashMap<>();
            result.put("sessionId", sessionId);  // 使用sessionId而不是数据库ID
            result.put("name", name);
            result.put("swcUrl", swcHttpPath);
            result.put("objUrl", objHttpPath);
            if (dracoHttpPath != null) {
                result.put("dracoUrl", dracoHttpPath);
            }
            result.put("objSize", objSize);
            result.put("createdAt", new Date());
            result.put("isTemporary", true);  // 标记为临时数据
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            // 清理失败的临时文件
            try {
                deleteDirectory(sessionDirFile);
            } catch (Exception cleanupEx) {
                logger.warn("清理失败临时文件时出错: sessionId={}", sessionId, cleanupEx);
            }
            logger.error("在线建模失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("创建失败: " + e.getMessage());
        }
    }
    
    /**
     * 递归删除目录（辅助方法）
     */
    private boolean runDracoCompressor(String objFilePath, String dracoFilePath, int compressionLevel, int quantizationBits) {
        try {
            File scriptFile = new File(dracoCompressorScript);
            if (!scriptFile.exists()) {
                logger.warn("draco_compressor.py 未找到: {} (可通过 DRACO_COMPRESSOR_SCRIPT 配置)", dracoCompressorScript);
                return false;
            }

            String[] cmd = new String[] {
                dracoCompressorPython,
                dracoCompressorScript,
                objFilePath,
                dracoFilePath,
                String.valueOf(compressionLevel),
                String.valueOf(quantizationBits)
            };

            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                logger.warn("DracoPy压缩失败 (exitCode={}): {}", exitCode, output.toString());
                return false;
            }

            File dracoFile = new File(dracoFilePath);
            if (!dracoFile.exists() || dracoFile.length() == 0) {
                logger.warn("DracoPy未生成有效 DRC 文件: {}", dracoFilePath);
                return false;
            }

            logger.info("DracoPy压缩成功: {} (输出大小={} bytes)", dracoFilePath, dracoFile.length());
            if (output.length() > 0) {
                logger.debug("DracoPy 输出: {}", output.toString().trim());
            }
            return true;
        } catch (Exception e) {
            logger.warn("执行 DracoPy 压缩失败: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 递归删除目录（辅助方法）
     */
    private void deleteDirectory(File directory) {
        if (directory.exists() && directory.isDirectory()) {
            File[] files = directory.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.isDirectory()) {
                        deleteDirectory(file);
                    } else {
                        file.delete();
                    }
                }
            }
            directory.delete();
        }
    }
    
    private String getUsernameFromToken(String token) {
        if (token == null || token.isEmpty()) {
            return null;
        }
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        try {
            if (jwtUtils.validateJwtToken(token)) {
                return jwtUtils.getUserNameFromJwtToken(token);
            }
        } catch (Exception e) {
            // token无效或过期，直接返回null，允许匿名
            return null;
        }
        return null;
    }

    private User getUserFromUsername(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }

    @Override
    public Map<String, Object> compressModelToDraco(String objFilePath, int compressionLevel, int quantizationBits) {
        try {
            logger.info("压缩模型为Draco格式: {}, level={}, bits={}", objFilePath, compressionLevel, quantizationBits);
            String dracoFilePath = objFilePath.replaceAll("\\.obj$", ".drc");
            boolean success = runDracoCompressor(objFilePath, dracoFilePath, compressionLevel, quantizationBits);
            if (!success) {
                return null;
            }
            Map<String, Object> result = new HashMap<>();
            result.put("dracoPath", dracoFilePath);
            File dracoFile = new File(dracoFilePath);
            if (dracoFile.exists()) {
                result.put("size", dracoFile.length());
            }
            return result;
        } catch (Exception e) {
            logger.error("压缩模型失败", e);
            return null;
        }
    }
} 