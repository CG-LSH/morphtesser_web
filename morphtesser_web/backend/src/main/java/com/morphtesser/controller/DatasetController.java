package com.morphtesser.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import java.util.*;

@RestController
@RequestMapping("/api/datasets")
@CrossOrigin(origins = "http://localhost:3000")
public class DatasetController {

    private static final Logger logger = LoggerFactory.getLogger(DatasetController.class);
    private static final String DATASETS_DIR = "Y:/morphtesser_exp/Datasets/";

    @GetMapping("/list")
    public ResponseEntity<List<Map<String, Object>>> listDatasets() {
        try {
            File datasetsDir = new File(DATASETS_DIR);
            if (!datasetsDir.exists() || !datasetsDir.isDirectory()) {
                logger.warn("Datasets directory does not exist: {}", DATASETS_DIR);
                return ResponseEntity.ok(new ArrayList<>());
            }

            List<Map<String, Object>> datasets = new ArrayList<>();
            File[] datasetDirs = datasetsDir.listFiles(File::isDirectory);
            
            if (datasetDirs != null) {
                for (File datasetDir : datasetDirs) {
                    Map<String, Object> datasetInfo = new HashMap<>();
                    datasetInfo.put("id", datasetDir.getName());
                    datasetInfo.put("name", datasetDir.getName());
                    
                    // 检查 results 文件夹
                    File resultsDir = new File(datasetDir, "results");
                    if (resultsDir.exists() && resultsDir.isDirectory()) {
                        File[] resultDirs = resultsDir.listFiles(File::isDirectory);
                        if (resultDirs != null) {
                            datasetInfo.put("modelCount", resultDirs.length);
                            datasetInfo.put("description", "Dataset with " + resultDirs.length + " neuron models");
                        } else {
                            datasetInfo.put("modelCount", 0);
                            datasetInfo.put("description", "Empty results folder");
                        }
                    } else {
                        datasetInfo.put("modelCount", 0);
                        datasetInfo.put("description", "No results folder found");
                    }
                    
                    datasetInfo.put("fileType", "both");
                    datasetInfo.put("createdAt", new Date(datasetDir.lastModified()));
                    datasetInfo.put("contributor", "System");
                    datasetInfo.put("species", "Unknown");
                    datasetInfo.put("brainRegion", "Unknown");
                    
                    datasets.add(datasetInfo);
                }
            }
            
            logger.info("Found {} datasets", datasets.size());
            return ResponseEntity.ok(datasets);
            
        } catch (Exception e) {
            logger.error("Error listing datasets", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{datasetId}/models")
    public ResponseEntity<List<Map<String, Object>>> listDatasetModels(@PathVariable String datasetId) {
        try {
            File resultsDir = new File(DATASETS_DIR + datasetId + "/results");
            if (!resultsDir.exists() || !resultsDir.isDirectory()) {
                return ResponseEntity.notFound().build();
            }

            List<Map<String, Object>> models = new ArrayList<>();
            File[] modelDirs = resultsDir.listFiles(File::isDirectory);
            
            if (modelDirs != null) {
                for (File modelDir : modelDirs) {
                    Map<String, Object> modelInfo = new HashMap<>();
                    modelInfo.put("id", modelDir.getName());
                    modelInfo.put("name", modelDir.getName());
                    
                    // 检查文件
                    File[] files = modelDir.listFiles();
                    if (files != null) {
                        for (File file : files) {
                            String fileName = file.getName().toLowerCase();
                            if (fileName.endsWith(".swc")) {
                                modelInfo.put("swcUrl", "/datasets/" + datasetId + "/results/" + modelDir.getName() + "/" + file.getName());
                            } else if (fileName.endsWith(".obj")) {
                                modelInfo.put("objUrl", "/datasets/" + datasetId + "/results/" + modelDir.getName() + "/" + file.getName());
                            } else if (fileName.endsWith(".log")) {
                                modelInfo.put("logUrl", "/datasets/" + datasetId + "/results/" + modelDir.getName() + "/" + file.getName());
                            }
                        }
                    }
                    
                    modelInfo.put("createdAt", new Date(modelDir.lastModified()));
                    models.add(modelInfo);
                }
            }
            
            return ResponseEntity.ok(models);
            
        } catch (Exception e) {
            logger.error("Error listing dataset models for dataset: {}", datasetId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{datasetId}/download")
    public ResponseEntity<Resource> downloadDataset(@PathVariable String datasetId) {
        try {
            File datasetDir = new File(DATASETS_DIR + datasetId);
            if (!datasetDir.exists() || !datasetDir.isDirectory()) {
                return ResponseEntity.notFound().build();
            }

            // 创建临时ZIP文件
            File tempZip = File.createTempFile(datasetId + "_dataset", ".zip");
            
            try (FileOutputStream fos = new FileOutputStream(tempZip);
                 ZipOutputStream zos = new ZipOutputStream(fos)) {
                
                addDirectoryToZip(datasetDir, datasetDir.getName(), zos);
            }
            
            // 创建Resource
            Resource resource = new UrlResource(tempZip.toURI());
            
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + datasetId + "_dataset.zip\"")
                    .body(resource);
                    
        } catch (Exception e) {
            logger.error("Error downloading dataset: {}", datasetId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    private void addDirectoryToZip(File dir, String basePath, ZipOutputStream zos) throws IOException {
        File[] files = dir.listFiles();
        if (files != null) {
            for (File file : files) {
                String filePath = basePath + "/" + file.getName();
                if (file.isDirectory()) {
                    addDirectoryToZip(file, filePath, zos);
                } else {
                    ZipEntry zipEntry = new ZipEntry(filePath);
                    zos.putNextEntry(zipEntry);
                    
                    try (FileInputStream fis = new FileInputStream(file)) {
                        byte[] buffer = new byte[1024];
                        int length;
                        while ((length = fis.read(buffer)) > 0) {
                            zos.write(buffer, 0, length);
                        }
                    }
                    zos.closeEntry();
                }
            }
        }
    }

    @GetMapping("/{datasetId}/models/{modelId}/download")
    public ResponseEntity<Resource> downloadModel(@PathVariable String datasetId, @PathVariable String modelId) {
        try {
            File modelDir = new File(DATASETS_DIR + datasetId + "/results/" + modelId);
            if (!modelDir.exists() || !modelDir.isDirectory()) {
                return ResponseEntity.notFound().build();
            }

            // 查找 OBJ 文件
            File objFile = null;
            File[] files = modelDir.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.getName().toLowerCase().endsWith(".obj")) {
                        objFile = file;
                        break;
                    }
                }
            }
            
            if (objFile == null) {
                return ResponseEntity.notFound().build();
            }
            
            // 创建Resource
            Resource resource = new UrlResource(objFile.toURI());
            
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + modelId + ".obj\"")
                    .body(resource);
                    
        } catch (Exception e) {
            logger.error("Error downloading model: {}/{}", datasetId, modelId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
} 