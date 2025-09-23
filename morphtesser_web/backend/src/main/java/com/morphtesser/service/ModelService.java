package com.morphtesser.service;

import com.morphtesser.model.NeuronModel;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface ModelService {
    ResponseEntity<?> uploadModel(MultipartFile file, String name, String token);
    ResponseEntity<NeuronModel> getModelById(Long id, String token);
    ResponseEntity<List<NeuronModel>> getUserModels(String token);
    ResponseEntity<?> deleteModel(Long id, String token);
    ResponseEntity<Resource> getModelFile(Long id, String type, String token);
    ResponseEntity<?> createModelFromOnlineBuilder(String name, String type, String token, MultipartFile swcFile);
    
    /**
     * 将模型的OBJ文件压缩为Draco格式
     *
     * @param objFilePath OBJ文件路径
     * @param compressionLevel 压缩级别 (0-10)
     * @param quantizationBits 量化位数 (1-31)
     * @return 包含压缩结果的Map
     */
    Map<String, Object> compressModelToDraco(String objFilePath, int compressionLevel, int quantizationBits);
} 