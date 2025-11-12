package com.morphtesser.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.morphtesser.model.Model;
import com.morphtesser.model.NeuronModel;
import com.morphtesser.service.ModelService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import com.morphtesser.model.ModelMetadata;
import com.morphtesser.model.ModelResponse;
import com.morphtesser.security.UserDetailsImpl;
import org.springframework.core.io.FileSystemResource;
import java.nio.file.Path;
import java.nio.file.Paths;

import java.util.List;
import java.util.Map;
import org.springframework.core.io.ClassPathResource;
import java.io.File;
import com.morphtesser.dto.NeuronModelDTO;
import org.modelmapper.ModelMapper;
import java.util.stream.Collectors;
import com.morphtesser.model.User;
import com.morphtesser.repository.ModelRepository;
import com.morphtesser.security.JwtUtils;
import com.morphtesser.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import java.util.ArrayList;
import org.springframework.core.io.UrlResource;

@RestController
@RequestMapping("/api/models")
@CrossOrigin(origins = {"http://localhost:3000", "http://cvcd.xyz", "https://cvcd.xyz", "http://cvcd.xyz:34080", "https://cvcd.xyz:34080"})
public class ModelController {

    private static final Logger logger = LoggerFactory.getLogger(ModelController.class);
    
    @Value("${dataset.upload.base-dir:/app/uploads}")
    private String datasetUploadBaseDir;

    @Value("${dataset.sample.dir:/app/uploads/LSH}")
    private String datasetSampleDir;

    private Path uploadBasePath() {
        return Paths.get(datasetUploadBaseDir).toAbsolutePath().normalize();
    }

    private Path resolveRelativePath(String relative) {
        if (relative == null) {
            return uploadBasePath();
        }
        String sanitized = relative.startsWith("/") ? relative.substring(1) : relative;
        return uploadBasePath().resolve(sanitized).normalize();
    }

    private String toRelative(Path path) {
        Path normalized = path.toAbsolutePath().normalize();
        Path base = uploadBasePath();
        try {
            return base.relativize(normalized).toString().replace("\\", "/");
        } catch (IllegalArgumentException ex) {
            logger.warn("Path {} is outside of base directory {}; storing absolute path", normalized, base);
            return normalized.toString().replace("\\", "/");
        }
    }

    @Autowired
    private ModelService modelService;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private ModelRepository modelRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadModel(
            @RequestParam("file") MultipartFile file,
            @RequestParam("metadata") String metadataJson,
            @RequestHeader("Authorization") String token) {
        
        logger.info("接收到上传请求: filename={}, size={}", file.getOriginalFilename(), file.getSize());
        
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("文件为空");
            }
            
            // 验证token
            if (!token.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("无效的认证令牌格式");
            }
            token = token.substring(7);

            // 解析元数据
            ObjectMapper mapper = new ObjectMapper();
            JsonNode metadata = mapper.readTree(metadataJson);
            
            // 获取模型名称
            String name = metadata.get("name").asText();
            logger.info("模型名称: {}", name);
            
            // 调用服务层处理上传
            return modelService.uploadModel(file, name, token);
            
        } catch (Exception e) {
            logger.error("模型上传失败", e);
            String errorMessage = e.getMessage();
            if (errorMessage == null || errorMessage.isEmpty()) {
                errorMessage = "服务器内部错误";
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "message", "上传失败: " + errorMessage,
                    "error", e.getClass().getSimpleName()
                ));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NeuronModel> getModelById(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        
        logger.info("获取模型详情: id={}", id);
        return modelService.getModelById(id, token);
    }

    @GetMapping("/user")
    public ResponseEntity<?> getUserModels(@RequestHeader("Authorization") String token) {
        logger.info("获取用户模型列表");
        
        String username = getUsernameFromToken(token);
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("无效的令牌");
        }
        
        User user = getUserFromUsername(username);
        List<NeuronModel> models = modelRepository.findByUserOrderByCreatedAtDesc(user);
        
        List<NeuronModelDTO> modelDTOs = models.stream()
            .map(model -> {
                NeuronModelDTO dto = modelMapper.map(model, NeuronModelDTO.class);
                dto.setUsername(model.getUser().getUsername());
                return dto;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(modelDTOs);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteModel(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        
        logger.info("删除模型: id={}", id);
        return modelService.deleteModel(id, token);
    }

    @GetMapping("/{id}/file/{type}")
    public ResponseEntity<Resource> getModelFile(
            @PathVariable Long id,
            @PathVariable String type,
            @RequestParam("token") String token) {
        
        logger.info("获取模型文件: id={}, type={}", id, type);

        String actualToken = token != null && token.startsWith("Bearer ") ? token : "Bearer " + token;
        return modelService.getModelFile(id, type, actualToken);
    }

    @GetMapping("/{id}/download/{type}")
    public ResponseEntity<Resource> downloadModelFile(
            @PathVariable Long id,
            @PathVariable String type,
            @RequestHeader("Authorization") String token) {
        
        logger.info("下载模型文件: id={}, type={}", id, type);
        
        ResponseEntity<Resource> response = modelService.getModelFile(id, type, token);
        
        if (response.getBody() != null) {
            String contentType;
            if ("obj".equals(type)) {
                contentType = "application/octet-stream";
            } else if ("draco".equals(type)) {
                contentType = "application/octet-stream";
            } else {
                contentType = "text/plain";
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + id + "." + type + "\"")
                    .body(response.getBody());
        }
        
        return response;
    }

    @GetMapping("/{id}/preview")
    public ResponseEntity<Resource> getModelPreview(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        
        logger.info("获取模型预览图片: id={}", id);
        
        try {
            // 获取模型
            ResponseEntity<NeuronModel> modelResponse = modelService.getModelById(id, token);
            if (modelResponse.getStatusCode().isError() || modelResponse.getBody() == null) {
                return ResponseEntity.notFound().build();
            }
            
            NeuronModel model = modelResponse.getBody();
            
            // 检查预览图片路径
            Path previewPath = resolveRelativePath(Paths.get("previews", id + ".png").toString());
            File previewFile = previewPath.toFile();
            
            if (!previewFile.exists()) {
                // 如果预览图片不存在，返回默认图片
                Resource defaultPreview = new ClassPathResource("static/images/default-neuron.png");
                return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(defaultPreview);
            }
            
            // 返回预览图片
                Resource resource = new FileSystemResource(previewFile);
            return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(resource);
            
        } catch (Exception e) {
            logger.error("获取模型预览图片失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/models/{id}/obj")
    public ResponseEntity<Resource> getModelObj(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        
        logger.info("获取模型OBJ文件: id={}", id);
        
        ResponseEntity<NeuronModel> modelResponse = modelService.getModelById(id, token);
        if (modelResponse.getStatusCode().isError() || modelResponse.getBody() == null) {
            return ResponseEntity.notFound().build();
        }
        
        NeuronModel model = modelResponse.getBody();
        if (model.getObjFilePath() != null && model.getObjFilePath().contains("sphere.obj")) {
            try {
                Resource resource = new ClassPathResource("static/models/sphere.obj");
                return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"sphere.obj\"")
                    .body(resource);
            } catch (Exception e) {
                logger.error("加载球体模型失败", e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
        
        Path path = resolveRelativePath(model.getObjFilePath());
        Resource resource = new FileSystemResource(path.toFile());
        
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + path.getFileName().toString() + "\"")
            .body(resource);
    }

    @PostMapping("/create")
    public ResponseEntity<?> createModel(
            @RequestParam("name") String name,
            @RequestParam("type") String type,
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam("swcFile") MultipartFile swcFile) {
        
        logger.info("创建在线模型: name={}, type={}", name, type);
        
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("模型名称不能为空");
        }
        
        return modelService.createModelFromOnlineBuilder(name, type, token, swcFile);
    }

    @PostMapping("/{id}/compress-draco")
    public ResponseEntity<?> compressModelToDraco(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam(value = "compression_level", defaultValue = "7") int compressionLevel,
            @RequestParam(value = "quantization_bits", defaultValue = "10") int quantizationBits) {
        
        logger.info("压缩模型为Draco格式: id={}, level={}, bits={}", id, compressionLevel, quantizationBits);
        
        try {
            // 获取模型
            ResponseEntity<NeuronModel> modelResponse = modelService.getModelById(id, token);
            if (modelResponse.getStatusCode().isError() || modelResponse.getBody() == null) {
                return ResponseEntity.notFound().build();
            }
            
            NeuronModel model = modelResponse.getBody();
            if (model.getObjFilePath() == null) {
                return ResponseEntity.badRequest().body("模型没有OBJ文件，无法压缩");
            }
            
            // 调用Python服务进行压缩
            Path objPath = resolveRelativePath(model.getObjFilePath());
            Map<String, Object> dracoResult = modelService.compressModelToDraco(objPath.toString(), compressionLevel, quantizationBits);
            
            if (dracoResult != null && dracoResult.containsKey("success") && (Boolean) dracoResult.get("success")) {
                String dracoAbsPath = (String) dracoResult.get("output_path");
                String dracoRelPath = toRelative(Paths.get(dracoAbsPath));
                model.setDracoFilePath(dracoRelPath);
                model.setCompressionRatio((Double) dracoResult.get("compression_ratio"));
                modelRepository.save(model);
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Draco压缩成功",
                    "compression_ratio", dracoResult.get("compression_ratio"),
                    "original_size", dracoResult.get("original_size"),
                    "compressed_size", dracoResult.get("compressed_size")
                ));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Draco压缩失败"));
            }
            
        } catch (Exception e) {
            logger.error("压缩模型失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "压缩失败: " + e.getMessage()));
        }
    }

    @GetMapping("/public-files")
    public List<Map<String, Object>> listPublicFiles() {
        File dir = Paths.get(datasetSampleDir).toFile();
        File[] files = dir.listFiles((d, name) -> name.toLowerCase().endsWith(".obj") || name.toLowerCase().endsWith(".swc"));
        List<Map<String, Object>> result = new ArrayList<>();
        if (files != null) {
            for (File file : files) {
                Map<String, Object> info = new java.util.HashMap<>();
                info.put("name", file.getName());
                info.put("size", file.length());
                info.put("type", file.getName().toLowerCase().endsWith(".obj") ? "OBJ" : "SWC");
                info.put("url", "/uploads/obj/" + file.getName());
                result.add(info);
            }
        }
        return result;
    }

    @GetMapping("/public")
    public List<NeuronModelDTO> getAllPublicModels() {
        List<NeuronModel> models = modelRepository.findAll();
        return models.stream()
            .map(model -> {
                NeuronModelDTO dto = modelMapper.map(model, NeuronModelDTO.class);
                if (model.getUser() != null) {
                    dto.setUsername(model.getUser().getUsername());
                }
                // 路径适配
                dto.setSwcUrl(convertToHttpUrl(model.getFilePath()));
                dto.setObjUrl(convertToHttpUrl(model.getObjFilePath()));
                return dto;
            })
            .collect(Collectors.toList());
    }

    @GetMapping("/{id}/file/draco")
    public ResponseEntity<Resource> getDracoFile(@PathVariable Long id) {
        try {
            NeuronModel model = modelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Model not found"));
            
            if (model.getDracoFilePath() == null) {
                return ResponseEntity.notFound().build();
            }
            
            // 构建本地文件路径
            Path dracoPath = resolveRelativePath(model.getDracoFilePath());
            File file = dracoPath.toFile();
            
            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }
            
            Path path = file.toPath();
            Resource resource = new UrlResource(path.toUri());
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "application/octet-stream")
                .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String getUsernameFromToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        if (jwtUtils.validateJwtToken(token)) {
            return jwtUtils.getUserNameFromJwtToken(token);
        }
        
        return null;
    }

    private User getUserFromUsername(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }

    private String convertToHttpUrl(String path) {
        if (path == null) return null;
        if (path.startsWith("/uploads/")) return path;
        String lower = path.toLowerCase();
        if (lower.endsWith(".obj")) {
            return "/uploads/obj/" + new java.io.File(path).getName();
        }
        if (lower.endsWith(".swc")) {
            return "/uploads/swc/" + new java.io.File(path).getName();
        }
        return path;
    }
} 