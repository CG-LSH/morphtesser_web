package com.morphtesser.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * 临时文件清理配置
 * 定期清理在线建模功能的临时文件（超过1小时的会话目录）
 */
@Component
public class TempFileCleanupConfig {

    private static final Logger logger = LoggerFactory.getLogger(TempFileCleanupConfig.class);

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

    @Value("${dataset.online-modeling.cleanup.max-age-hours:1}")
    private int maxAgeHours;

    /**
     * 每小时执行一次清理任务
     */
    @Scheduled(fixedRate = 3600000) // 1小时 = 3600000毫秒
    public void cleanupOldTempFiles() {
        try {
            Path tempDirPath = getNormalizedTempDir();
            if (!Files.exists(tempDirPath) || !Files.isDirectory(tempDirPath)) {
                return;
            }

            File tempDirFile = tempDirPath.toFile();
            File[] sessionDirs = tempDirFile.listFiles(File::isDirectory);
            
            if (sessionDirs == null) {
                return;
            }

            Instant cutoffTime = Instant.now().minus(maxAgeHours, ChronoUnit.HOURS);
            int deletedCount = 0;

            for (File sessionDir : sessionDirs) {
                try {
                    // 检查目录的最后修改时间
                    FileTime lastModified = Files.getLastModifiedTime(sessionDir.toPath());
                    if (lastModified.toInstant().isBefore(cutoffTime)) {
                        deleteDirectory(sessionDir);
                        deletedCount++;
                        logger.debug("清理过期临时目录: {}", sessionDir.getName());
                    }
                } catch (Exception e) {
                    logger.warn("清理临时目录失败: {}", sessionDir.getName(), e);
                }
            }

            if (deletedCount > 0) {
                logger.info("临时文件清理完成: 删除 {} 个过期会话目录（超过 {} 小时）", deletedCount, maxAgeHours);
            }

        } catch (Exception e) {
            logger.error("临时文件清理任务执行失败", e);
        }
    }

    /**
     * 递归删除目录
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
}

