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

    // 本地文件夹路径 - 使用neuromorpho_08结果目录
    private static final String LOCAL_BASE_PATH = "X:/morphtesser_exp/neuromorpho_08/results";
    
    // 文件大小限制：无限制
    // private static final long MAX_FILE_SIZE = 20 * 1024 * 1024; // 已移除大小限制

    public byte[] readObj(String id, String quality) throws IOException {
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

        // 根据ID查找对应的OBJ文件
        Path targetFile = findObjById(basePath, id, quality);
        if (targetFile == null) {
            throw new IOException("未找到ID为 " + id + " 的OBJ文件");
        }

        return readFileContent(targetFile);
    }

    public byte[] readDraco(String id, String quality) throws IOException {
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

        // 根据ID查找对应的DRC文件
        Path targetFile = findDracoById(basePath, id, quality);
        if (targetFile == null) {
            throw new IOException("未找到ID为 " + id + " 的DRC文件");
        }

        return readFileContent(targetFile);
    }

    /**
     * 根据ID查找对应的OBJ文件
     * 查找路径格式：X:/morphtesser_exp/neuromorpho_08/results/{前三位}/{id}.swc/data_{quality}.obj
     * 注意：查找目录时需要补0，但查找具体文件时使用原始ID
     */
    private Path findObjById(Path basePath, String id, String quality) throws IOException {
        // 将ID转换为数字，然后格式化为6位数字（不足6位前面补0）
        int idNum;
        try {
            idNum = Integer.parseInt(id);
        } catch (NumberFormatException e) {
            throw new IOException("ID格式无效: " + id);
        }
        
        // 格式化为6位数字，不足6位前面补0（用于查找目录）
        String formattedId = String.format("%06d", idNum);
        
        // 获取ID的前三位作为目录名
        String prefix = formattedId.substring(0, 3);
        Path idDir = basePath.resolve(prefix);
        
        if (!Files.exists(idDir) || !Files.isDirectory(idDir)) {
            return null;
        }
        
        // 查找对应的.swc目录（使用原始ID，不补0）
        try (var stream = Files.list(idDir)) {
            for (Path path : stream.collect(java.util.stream.Collectors.toList())) {
                String fileName = path.getFileName().toString();
                
                if (fileName.equals(id + ".swc") && Files.isDirectory(path)) {
                    // 在.swc目录中查找OBJ文件
                    String objFileName = "data_" + quality + ".obj";
                    Path objFile = path.resolve(objFileName);
                    
                    if (Files.exists(objFile) && Files.isRegularFile(objFile) && Files.size(objFile) > 0) {
                        return objFile;
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * 根据ID查找对应的DRC文件
     * 查找路径格式：X:/morphtesser_exp/neuromorpho_08/results/{前三位}/{id}.swc/data_{quality}.drc
     * 注意：查找目录时需要补0，但查找具体文件时使用原始ID
     */
    private Path findDracoById(Path basePath, String id, String quality) throws IOException {
        // 将ID转换为数字，然后格式化为6位数字（不足6位前面补0）
        int idNum;
        try {
            idNum = Integer.parseInt(id);
        } catch (NumberFormatException e) {
            throw new IOException("ID格式无效: " + id);
        }
        
        // 格式化为6位数字，不足6位前面补0（用于查找目录）
        String formattedId = String.format("%06d", idNum);
        
        // 获取ID的前三位作为目录名
        String prefix = formattedId.substring(0, 3);
        Path idDir = basePath.resolve(prefix);
        
        if (!Files.exists(idDir) || !Files.isDirectory(idDir)) {
            return null;
        }
        
        // 查找对应的.swc目录（使用原始ID，不补0）
        try (var stream = Files.list(idDir)) {
            for (Path path : stream.collect(java.util.stream.Collectors.toList())) {
                String fileName = path.getFileName().toString();
                
                if (fileName.equals(id + ".swc") && Files.isDirectory(path)) {
                    // 在.swc目录中查找DRC文件
                    // 尝试多种命名规则
                    String[] dracoPatterns = {
                        "data_" + quality + ".drc",           // data_refined.drc
                        "data_" + quality + "_qp14.drc",      // data_refined_qp14.drc
                        "data_" + quality + "_qp10.drc",      // data_refined_qp10.drc
                        "data_" + quality + "_qp7.drc"        // data_refined_qp7.drc
                    };
                    
                    for (String dracoFileName : dracoPatterns) {
                        Path dracoFile = path.resolve(dracoFileName);
                        if (Files.exists(dracoFile) && Files.isRegularFile(dracoFile) && Files.size(dracoFile) > 0) {
                            return dracoFile;
                        }
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * 递归查找目录中所有OBJ文件（无大小限制）
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
                           Files.size(path) > 0; // 只检查是否为空文件
                } catch (IOException e) {
                    return false;
                }
            }).forEach(validObjFiles::add);
        }

        return validObjFiles;
    }

    /**
     * 读取文件内容
     */
    private byte[] readFileContent(Path filePath) throws IOException {
        if (!Files.exists(filePath)) {
            throw new IOException("文件不存在: " + filePath.toAbsolutePath());
        }
        
        if (!Files.isReadable(filePath)) {
            throw new IOException("文件不可读: " + filePath.toAbsolutePath());
        }
        
        // 检查文件大小
        try {
            long fileSize = Files.size(filePath);
            if (fileSize == 0) {
                throw new IOException("文件大小为0字节: " + filePath.toAbsolutePath());
            }
        } catch (IOException e) {
            // 忽略文件大小检查错误
        }
        
        try (InputStream in = Files.newInputStream(filePath);
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[65536];
            int n;
            while ((n = in.read(buf)) > 0) {
                bos.write(buf, 0, n);
            }
            return bos.toByteArray();
        } catch (IOException e) {
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

