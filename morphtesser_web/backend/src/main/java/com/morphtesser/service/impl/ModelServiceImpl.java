package com.morphtesser.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.morphtesser.model.NeuronModel;
import com.morphtesser.model.User;
import com.morphtesser.repository.ModelRepository;
import com.morphtesser.repository.UserRepository;
import com.morphtesser.security.JwtUtils;
import com.morphtesser.service.ModelService;
import com.morphtesser.service.PythonService;
import com.morphtesser.service.ModelPreviewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
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
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ModelServiceImpl implements ModelService {
    private static final Logger logger = LoggerFactory.getLogger(ModelServiceImpl.class);
    
    // 根目录写死
    private static final String BASE_DIR = "Z:/lsh/morphtesser_exp/DataSet/";
    
    @Autowired
    private ModelRepository modelRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @Autowired
    private PythonService pythonService;
    
    @Autowired
    private ModelPreviewService modelPreviewService;

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
            String relativeDir = userId + "/" + modelId + "/";
            String targetDir = BASE_DIR + relativeDir;
            File dir = new File(targetDir);
            if (!dir.exists()) dir.mkdirs();

            // 4. 保存文件
            String fileName = file.getOriginalFilename();
            String relativeFilePath = relativeDir + fileName;
            String absoluteFilePath = BASE_DIR + relativeFilePath;
            file.transferTo(new File(absoluteFilePath));
            model.setFilePath(relativeFilePath);

            // 5. 如果是SWC，调用Python服务
            String extension = fileName.substring(fileName.lastIndexOf("."));
            if (extension.equalsIgnoreCase(".swc")) {
                Map<String, Object> result = pythonService.convertSwcToObj(absoluteFilePath);
                // Python返回obj的绝对路径，转为相对路径
                String objAbsPath = (String) result.get("objPath");
                String objRelPath = objAbsPath.replace(BASE_DIR, "");
                model.setObjFilePath(objRelPath);
                model.setLength((Double) result.get("length"));
                model.setSurfaceArea((Double) result.get("surfaceArea"));
                model.setVolume((Double) result.get("volume"));
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
                Path swcFilePath = Paths.get(BASE_DIR, model.getFilePath());
                Files.deleteIfExists(swcFilePath);
            }
            if (model.getObjFilePath() != null) {
                Path objFilePath = Paths.get(BASE_DIR, model.getObjFilePath());
                Files.deleteIfExists(objFilePath);
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
            if ("obj".equals(type)) {
                relPath = model.getObjFilePath();
            } else if ("swc".equals(type)) {
                relPath = model.getFilePath();
            } else {
                return ResponseEntity.badRequest().build();
            }
            if (relPath == null) return ResponseEntity.notFound().build();
            Path absPath = Paths.get(BASE_DIR, relPath);
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
        try {
            // 验证令牌并获取用户名
            String username = getUsernameFromToken(token);
            if (username == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("无效的令牌");
            }
            // 获取用户
            User user = getUserFromUsername(username);
            // 创建用户目录
            String userDir = BASE_DIR + username + "/";
            Files.createDirectories(Paths.get(userDir));
            // 保存SWC文件
            String swcFileName = UUID.randomUUID().toString() + ".swc";
            String swcFilePath = Paths.get(userDir, swcFileName).toString();
            swcFile.transferTo(new File(swcFilePath));
            // 调用FastAPI服务，获得OBJ
            RestTemplate restTemplate = new RestTemplate();
            String url = "http://localhost:8000/swc2obj/";
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new FileSystemResource(swcFilePath));
            // 关键：根据 type 传递 result_type
            String resultType = "refined";
            if (!"refine".equals(type)) {
                resultType = "raw";
            }
            body.add("result_type", resultType);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<byte[]> response = restTemplate.exchange(
                url, HttpMethod.POST, requestEntity, byte[].class);
            String objFileName;
            if ("refine".equals(type)) {
                objFileName = swcFileName.replace(".swc", "_refined.obj");
            } else {
                objFileName = swcFileName.replace(".swc", ".obj");
            }
            String objFilePath = Paths.get(userDir, objFileName).toString();
            if (response.getStatusCode() == HttpStatus.OK) {
                Files.write(Paths.get(objFilePath), response.getBody());
            } else {
                throw new RuntimeException("SWC转OBJ失败: " + response.getStatusCode());
            }
            // 创建模型记录
            NeuronModel model = new NeuronModel();
            model.setName(name);
            model.setUser(user);
            model.setCreatedAt(new Date());
            model.setFilePath(swcFilePath.replace(BASE_DIR, ""));
            // 关键：objFilePath 改为 HTTP 路径
            String objHttpPath = "/uploads/obj/" + objFileName;
            model.setObjFilePath(objHttpPath);
            model.setBrainRegion("未指定"); // 补充，避免为null
            model.setDescription("未填写"); // 补充，避免为null
            model.setFileType("swc"); // 补充，避免为null
            model.setSpecies("未指定"); // 补充，避免为null
            // 其余元数据可补充
            NeuronModel savedModel = modelRepository.save(model);
            logger.info("在线建模成功: id={}, name={}, user={}", savedModel.getId(), name, username);
            return ResponseEntity.ok(savedModel);
        } catch (Exception e) {
            logger.error("在线建模失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("创建失败: " + e.getMessage());
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
} 