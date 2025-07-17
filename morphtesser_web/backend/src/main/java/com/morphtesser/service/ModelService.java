package com.morphtesser.service;

import com.morphtesser.model.NeuronModel;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ModelService {
    ResponseEntity<?> uploadModel(MultipartFile file, String name, String token);
    ResponseEntity<NeuronModel> getModelById(Long id, String token);
    ResponseEntity<List<NeuronModel>> getUserModels(String token);
    ResponseEntity<?> deleteModel(Long id, String token);
    ResponseEntity<Resource> getModelFile(Long id, String type, String token);
    ResponseEntity<?> createModelFromOnlineBuilder(String name, String type, String token, MultipartFile swcFile);
} 