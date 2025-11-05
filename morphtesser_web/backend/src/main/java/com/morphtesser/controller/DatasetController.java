package com.morphtesser.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.annotation.PostConstruct;

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
    
    private static final String DATASETS_DIR = "Y:/morphtesser_exp/Final_Results_Datasets/";
    private static final String STATIC_INDEX_DIR = "morphtesser_web/backend/cache/swc-index/";
    // 静态索引方案：不再使用内存列表缓存

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

    @GetMapping("/{datasetId}/swc-files")
    public ResponseEntity<Map<String, Object>> getSwcFiles(
            @PathVariable String datasetId,
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch,
            @RequestHeader(value = "If-Modified-Since", required = false) String ifModifiedSince
    ) {
        try {
            // 只读静态索引文件，不再动态生成
            File indexFile = new File(STATIC_INDEX_DIR + datasetId + ".swc-list.json");
            if (!indexFile.exists()) {
                logger.warn("Static index file not found for dataset: {}", datasetId);
                return ResponseEntity.notFound().build();
            }

            String etag = generateEtagForFile(indexFile, datasetId);
            long lastModified = indexFile.lastModified();

            // 协商缓存处理
            if (etag.equals(ifNoneMatch)) {
                return ResponseEntity.status(304)
                        .header(HttpHeaders.ETAG, etag)
                        .header(HttpHeaders.LAST_MODIFIED, String.valueOf(lastModified))
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000") // 1年缓存
                        .build();
            }

            // 读取文件并返回
            String json = readAll(indexFile);
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = new com.fasterxml.jackson.databind.ObjectMapper().readValue(json, Map.class);

            return ResponseEntity.ok()
                    .header(HttpHeaders.ETAG, etag)
                    .header(HttpHeaders.LAST_MODIFIED, String.valueOf(lastModified))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000") // 1年缓存
                    .body(payload);

        } catch (Exception e) {
            logger.error("Error getting SWC files for dataset: {}", datasetId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostConstruct
    public void preloadStaticIndexes() {
        try {
            File datasetsDir = new File(DATASETS_DIR);
            if (!datasetsDir.exists() || !datasetsDir.isDirectory()) {
                logger.warn("Datasets directory not found: {}", DATASETS_DIR);
                return;
            }
            
            File indexDir = new File(STATIC_INDEX_DIR);
            if (!indexDir.exists()) {
                indexDir.mkdirs();
                logger.info("Created static index directory: {}", STATIC_INDEX_DIR);
            }
            
            File[] datasetDirs = datasetsDir.listFiles(File::isDirectory);
            if (datasetDirs == null) return;
            
            for (File d : datasetDirs) {
                String id = d.getName();
                File indexFile = new File(indexDir, id + ".swc-list.json");
                
                // 如果静态文件不存在，生成它
                if (!indexFile.exists()) {
                    try {
                        Map<String, Object> built = buildSwcListForDataset(id);
                        writeJsonToFile(indexFile, built);
                        logger.info("Generated static index for dataset: {} ({} models)", id, built.get("count"));
                    } catch (Exception ex) {
                        logger.warn("Failed to generate static index for {}: {}", id, ex.getMessage());
                    }
                } else {
                    logger.info("Static index already exists for dataset: {}", id);
                }
            }
            logger.info("Static SWC index preload finished");
        } catch (Exception e) {
            logger.warn("Preload static indexes error: {}", e.getMessage());
        }
    }

    private Map<String, Object> buildSwcListForDataset(String datasetId) {
        File resultsDir = new File(DATASETS_DIR + datasetId + "/results");
        List<Map<String, String>> swcFiles = new ArrayList<>();
        if (resultsDir.exists() && resultsDir.isDirectory()) {
            File[] modelDirs = resultsDir.listFiles(File::isDirectory);
            if (modelDirs != null) {
                for (File modelDir : modelDirs) {
                    File[] files = modelDir.listFiles();
                    if (files != null) {
                        for (File file : files) {
                            if (file.getName().toLowerCase().endsWith(".swc")) {
                                Map<String, String> fileInfo = new HashMap<>();
                                fileInfo.put("name", file.getName());
                                fileInfo.put("folderName", modelDir.getName());
                                swcFiles.add(fileInfo);
                                break;
                            }
                        }
                    }
                }
            }
        }
        Map<String, Object> response = new HashMap<>();
        response.put("files", swcFiles);
        response.put("count", swcFiles.size());
        response.put("generatedAt", System.currentTimeMillis());
        return response;
    }

    private void writeJsonToFile(File file, Map<String, Object> data) throws IOException {
        file.getParentFile().mkdirs();
        String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(data);
        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(json.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        }
    }

    private String readAll(File file) throws IOException {
        byte[] bytes = java.nio.file.Files.readAllBytes(file.toPath());
        return new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
    }

    private String generateEtagForFile(File file, String datasetId) {
        long lm = file.lastModified();
        long len = file.length();
        return "\"" + datasetId + ":" + len + ":" + lm + "\"";
    }

    // 汇总接口：仅返回轻量元信息，便于首屏使用
    @GetMapping("/summaries")
    public ResponseEntity<List<Map<String, Object>>> datasetSummaries() {
        try {
            File datasetsDirFile = new File(DATASETS_DIR);
            if (!datasetsDirFile.exists() || !datasetsDirFile.isDirectory()) {
                return ResponseEntity.ok(new ArrayList<>());
            }

            List<Map<String, Object>> summaries = new ArrayList<>();
            File[] datasetDirs = datasetsDirFile.listFiles(File::isDirectory);
            if (datasetDirs != null) {
                for (File datasetDir : datasetDirs) {
                    Map<String, Object> s = new HashMap<>();
                    s.put("id", datasetDir.getName());
                    s.put("name", datasetDir.getName());
                    File resultsDir = new File(datasetDir, "results");
                    int count = 0;
                    if (resultsDir.exists() && resultsDir.isDirectory()) {
                        File[] resultDirs = resultsDir.listFiles(File::isDirectory);
                        count = (resultDirs != null) ? resultDirs.length : 0;
                    }
                    s.put("modelCount", count);
                    s.put("updatedAt", new Date(datasetDir.lastModified()));
                    summaries.add(s);
                }
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=1800")
                    .body(summaries);
        } catch (Exception e) {
            logger.error("Error building dataset summaries", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{datasetId}/swc/{modelId}/{filename}")
    public ResponseEntity<Resource> getSwcFile(@PathVariable String datasetId, @PathVariable String modelId, @PathVariable String filename) {
        try {
            File swcFile = new File(DATASETS_DIR + datasetId + "/results/" + modelId + "/" + filename);
            if (!swcFile.exists() || !swcFile.isFile()) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new UrlResource(swcFile.toURI());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
                    
        } catch (Exception e) {
            logger.error("Error getting SWC file: {}/{}/{}", datasetId, modelId, filename, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{datasetId}/drc/{modelId}/{filename}")
    public ResponseEntity<Resource> getDrcFile(@PathVariable String datasetId, @PathVariable String modelId, @PathVariable String filename) {
        try {
            File drcFile = new File(DATASETS_DIR + datasetId + "/results/" + modelId + "/" + filename);
            if (!drcFile.exists() || !drcFile.isFile()) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new UrlResource(drcFile.toURI());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
                    
        } catch (Exception e) {
            logger.error("Error getting DRC file: {}/{}/{}", datasetId, modelId, filename, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{datasetId}/thumbnail/{modelName}")
    public ResponseEntity<Resource> getThumbnail(@PathVariable String datasetId, @PathVariable String modelName) {
        try {
            // 模型文件夹名称可能包含.swc扩展名，需要处理两种情况
            String folderName = modelName;
            if (!folderName.endsWith(".swc")) {
                folderName = modelName + ".swc";
            }
            
            // 根据测试结果，缩略图文件命名规则：{folderName}_thumbnail.png
            String[] possiblePaths = {
                DATASETS_DIR + datasetId + "/results/" + folderName + "/" + folderName + "_thumbnail.png",
                DATASETS_DIR + datasetId + "/results/" + folderName + "/" + modelName + "_thumbnail.png",
                DATASETS_DIR + datasetId + "/results/" + folderName + "/" + folderName + ".swc_thumbnail.png",
                DATASETS_DIR + datasetId + "/results/" + folderName + "/" + modelName + ".swc_thumbnail.png",
                DATASETS_DIR + datasetId + "/results/" + folderName + "/thumbnail.png",
                DATASETS_DIR + datasetId + "/results/" + folderName + "/" + modelName + ".png",
                DATASETS_DIR + datasetId + "/thumbnails/" + modelName + ".png"
            };
            
            File thumbnailFile = null;
            
            // 遍历可能的路径
            for (String path : possiblePaths) {
                File file = new File(path);
                if (file.exists() && file.isFile()) {
                    thumbnailFile = file;
                    break;
                }
            }
            
            if (thumbnailFile == null) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new UrlResource(thumbnailFile.toURI());
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                    .body(resource);
                    
        } catch (Exception e) {
            logger.error("Error getting thumbnail: {}/{}", datasetId, modelName, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{datasetId}/debug/thumbnail/{modelName}")
    public ResponseEntity<Map<String, Object>> debugThumbnail(@PathVariable String datasetId, @PathVariable String modelName) {
        try {
            String folderName = modelName + ".swc";
            String thumbnailPath = DATASETS_DIR + datasetId + "/results/" + folderName + "/" + folderName + "_thumbnail.png";
            File thumbnailFile = new File(thumbnailPath);
            
            Map<String, Object> debugInfo = new HashMap<>();
            debugInfo.put("modelName", modelName);
            debugInfo.put("folderName", folderName);
            debugInfo.put("thumbnailPath", thumbnailPath);
            debugInfo.put("exists", thumbnailFile.exists());
            debugInfo.put("isFile", thumbnailFile.isFile());
            debugInfo.put("canRead", thumbnailFile.canRead());
            debugInfo.put("absolutePath", thumbnailFile.getAbsolutePath());
            
            // 检查父目录
            File parentDir = thumbnailFile.getParentFile();
            debugInfo.put("parentDirExists", parentDir != null && parentDir.exists());
            debugInfo.put("parentDirCanRead", parentDir != null && parentDir.canRead());
            if (parentDir != null) {
                debugInfo.put("parentDirPath", parentDir.getAbsolutePath());
                String[] files = parentDir.list();
                debugInfo.put("filesInParent", files != null ? java.util.Arrays.asList(files) : "null");
            }
            
            // 检查网络驱动器访问权限
            File yDrive = new File("Y:");
            debugInfo.put("yDriveExists", yDrive.exists());
            debugInfo.put("yDriveCanRead", yDrive.canRead());
            debugInfo.put("yDriveAbsolutePath", yDrive.getAbsolutePath());
            
            // 检查数据集根目录
            File datasetRoot = new File(DATASETS_DIR + datasetId);
            debugInfo.put("datasetRootExists", datasetRoot.exists());
            debugInfo.put("datasetRootCanRead", datasetRoot.canRead());
            debugInfo.put("datasetRootPath", datasetRoot.getAbsolutePath());
            
            return ResponseEntity.ok(debugInfo);
            
        } catch (Exception e) {
            Map<String, Object> errorInfo = new HashMap<>();
            errorInfo.put("error", "Exception: " + e.getMessage());
            errorInfo.put("stackTrace", java.util.Arrays.toString(e.getStackTrace()));
            return ResponseEntity.ok(errorInfo);
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