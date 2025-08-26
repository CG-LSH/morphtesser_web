package com.morphtesser.service;

import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class SmbFileService {

    // 本地文件夹路径 - 使用guest目录
    private static final String LOCAL_BASE_PATH = "Z:/lsh/morphtesser_exp/DataSet/guest";
    
    // 文件大小限制：20MB
    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes

    public byte[] readObj(String id, String quality) throws IOException {
        // 忽略传入的ID，随机选择OBJ文件
        System.out.println("收到请求 - ID: " + id + ", 质量: " + quality + "，将随机选择不超过20MB的OBJ文件");
        
        // 检查基础路径是否存在
        Path basePath = Paths.get(LOCAL_BASE_PATH);
        if (!Files.exists(basePath)) {
            throw new IOException("基础路径不存在: " + basePath.toAbsolutePath());
        }
        if (!Files.isDirectory(basePath)) {
            throw new IOException("基础路径不是目录: " + basePath.toAbsolutePath());
        }
        if (!Files.isReadable(basePath)) {
            throw new IOException("基础路径不可读: " + basePath.toAbsolutePath());
        }

        // 递归查找所有符合条件的OBJ文件（不超过20MB）
        List<Path> validObjFiles = findValidObjFiles(basePath);
        if (validObjFiles.isEmpty()) {
            throw new IOException("在 " + basePath.toAbsolutePath() + " 目录中未找到任何不超过20MB的OBJ文件");
        }

        // 随机选择一个符合条件的OBJ文件
        Random random = new Random();
        Path selectedFile = validObjFiles.get(random.nextInt(validObjFiles.size()));
        System.out.println("随机选择的文件: " + selectedFile.toAbsolutePath() + " (大小: " + formatFileSize(Files.size(selectedFile)) + ")");

        return readFileContent(selectedFile);
    }

    /**
     * 递归查找目录中所有符合条件的OBJ文件（不超过20MB）
     */
    private List<Path> findValidObjFiles(Path directory) throws IOException {
        List<Path> validObjFiles = new ArrayList<>();
        
        if (!Files.isDirectory(directory)) {
            return validObjFiles;
        }

        try (var stream = Files.walk(directory)) {
            stream.filter(path -> {
                try {
                    String fileName = path.getFileName().toString().toLowerCase();
                    return fileName.endsWith(".obj") && 
                           Files.isRegularFile(path) && 
                           Files.size(path) <= MAX_FILE_SIZE;
                } catch (IOException e) {
                    System.err.println("检查文件大小时出错: " + path + ", 错误: " + e.getMessage());
                    return false;
                }
            }).forEach(validObjFiles::add);
        }

        System.out.println("在目录 " + directory.toAbsolutePath() + " 中找到 " + validObjFiles.size() + " 个不超过20MB的OBJ文件");
        return validObjFiles;
    }

    /**
     * 读取文件内容
     */
    private byte[] readFileContent(Path filePath) throws IOException {
        System.out.println("开始读取文件: " + filePath.toAbsolutePath());
        
        if (!Files.exists(filePath)) {
            throw new IOException("文件不存在: " + filePath.toAbsolutePath());
        }
        
        if (!Files.isReadable(filePath)) {
            throw new IOException("文件不可读: " + filePath.toAbsolutePath());
        }
        
        // 检查文件大小
        try {
            long fileSize = Files.size(filePath);
            System.out.println("文件大小: " + fileSize + " 字节");
            if (fileSize == 0) {
                throw new IOException("文件大小为0字节: " + filePath.toAbsolutePath());
            }
        } catch (IOException e) {
            System.err.println("无法获取文件大小: " + e.getMessage());
        }
        
        try (InputStream in = Files.newInputStream(filePath);
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[65536];
            int n;
            while ((n = in.read(buf)) > 0) {
                bos.write(buf, 0, n);
            }
            System.out.println("成功读取文件: " + filePath.toAbsolutePath() + ", 大小: " + bos.size() + " 字节");
            return bos.toByteArray();
        } catch (IOException e) {
            System.err.println("读取文件失败: " + filePath.toAbsolutePath() + ", 错误: " + e.getMessage());
            throw e;
        }
    }

    /**
     * 格式化文件大小显示
     */
    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
    }
}

