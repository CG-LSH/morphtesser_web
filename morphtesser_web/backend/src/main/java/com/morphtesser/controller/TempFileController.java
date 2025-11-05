package com.morphtesser.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 临时文件控制器
 * 用于在线建模功能的临时文件访问，不保存到数据库
 */
@RestController
@RequestMapping("/api/temp/online-modeling")
@CrossOrigin(origins = "*")
public class TempFileController {

    private static final Logger logger = LoggerFactory.getLogger(TempFileController.class);

    @Value("${dataset.online-modeling.temp-dir:./temp/online-modeling/}")
    private String tempDir;
    
    /**
     * 规范化临时目录路径（与ModelServiceImpl保持一致）
     */
    private Path getNormalizedTempDir() {
        Path tempDirPath = Paths.get(tempDir);
        if (!tempDirPath.isAbsolute()) {
            // 相对于项目根目录
            String projectRoot = System.getProperty("user.dir");
            // 如果在backend目录运行，需要回到项目根目录
            if (projectRoot.endsWith("backend")) {
                projectRoot = new File(projectRoot).getParent();
            }
            tempDirPath = Paths.get(projectRoot, tempDir);
        }
        return tempDirPath;
    }

    /**
     * 获取临时文件（SWC、OBJ、DRC）
     */
    @GetMapping("/{sessionId}/{filename}")
    public ResponseEntity<Resource> getTempFile(
            @PathVariable String sessionId,
            @PathVariable String filename) {
        try {
            // 安全检查：防止路径遍历攻击
            if (sessionId.contains("..") || filename.contains("..")) {
                logger.warn("检测到路径遍历攻击: sessionId={}, filename={}", sessionId, filename);
                return ResponseEntity.badRequest().build();
            }

            // 构建文件路径（使用规范化路径）
            Path filePath = getNormalizedTempDir().resolve(sessionId).resolve(filename);
            File file = filePath.toFile();

            if (!file.exists() || !file.isFile()) {
                logger.warn("临时文件不存在: {}", filePath.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(file);
            
            // 设置Content-Type
            String contentType = getContentType(filename);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    .header(HttpHeaders.EXPIRES, "0")
                    .body(resource);

        } catch (Exception e) {
            logger.error("获取临时文件失败: sessionId={}, filename={}", sessionId, filename, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * 清理指定会话的临时文件
     */
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<String> deleteSessionFiles(@PathVariable String sessionId) {
        try {
            // 安全检查
            if (sessionId.contains("..")) {
                return ResponseEntity.badRequest().body("无效的会话ID");
            }

            // 使用规范化路径
            Path sessionDirPath = getNormalizedTempDir().resolve(sessionId);
            File dir = sessionDirPath.toFile();

            if (!dir.exists() || !dir.isDirectory()) {
                return ResponseEntity.ok().body("会话目录不存在");
            }

            // 删除目录中的所有文件
            int deletedCount = deleteDirectory(dir);
            logger.info("清理临时文件: sessionId={}, 删除文件数={}", sessionId, deletedCount);
            
            return ResponseEntity.ok().body("已清理 " + deletedCount + " 个文件");
            
        } catch (Exception e) {
            logger.error("清理临时文件失败: sessionId={}", sessionId, e);
            return ResponseEntity.status(500).body("清理失败: " + e.getMessage());
        }
    }

    /**
     * 获取Content-Type
     */
    private String getContentType(String filename) {
        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        switch (extension) {
            case "swc":
                return "text/plain";
            case "obj":
                return "text/plain";  // OBJ文件是文本格式
            case "drc":
                return "application/octet-stream";
            default:
                return "application/octet-stream";
        }
    }

    /**
     * 递归删除目录
     */
    private int deleteDirectory(File directory) {
        int count = 0;
        if (directory.exists() && directory.isDirectory()) {
            File[] files = directory.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.isDirectory()) {
                        count += deleteDirectory(file);
                    } else {
                        if (file.delete()) {
                            count++;
                        }
                    }
                }
            }
            // 删除空目录
            directory.delete();
        }
        return count;
    }
}

