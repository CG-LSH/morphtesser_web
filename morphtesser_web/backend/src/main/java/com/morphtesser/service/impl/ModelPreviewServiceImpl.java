package com.morphtesser.service.impl;

import com.morphtesser.service.ModelPreviewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class ModelPreviewServiceImpl implements ModelPreviewService {
    private static final Logger logger = LoggerFactory.getLogger(ModelPreviewServiceImpl.class);
    
    @Value("${python.executable}")
    private String pythonExecutable;
    
    @Value("${python.preview-script-path}")
    private String previewScriptPath;
    
    @Override
    public boolean generatePreviewImage(String objFilePath, String outputImagePath) {
        try {
            logger.info("开始生成预览图片: {} -> {}", objFilePath, outputImagePath);
            
            // 检查OBJ文件是否存在
            File objFile = new File(objFilePath);
            if (!objFile.exists()) {
                logger.error("OBJ文件不存在: {}", objFilePath);
                return false;
            }
            
            // 检查Python脚本是否存在
            File scriptFile = new File(previewScriptPath);
            if (!scriptFile.exists()) {
                logger.error("预览脚本不存在: {}", previewScriptPath);
                return useDefaultPreview(outputImagePath);
            }
            
            // 构建Python命令
            ProcessBuilder processBuilder = new ProcessBuilder(
                pythonExecutable,
                previewScriptPath,
                objFilePath,
                outputImagePath
            );
            
            // 合并标准错误和标准输出
            processBuilder.redirectErrorStream(true);
            
            logger.info("执行Python命令: {} {} {} {}", 
                pythonExecutable, previewScriptPath, objFilePath, outputImagePath);
            
            // 启动进程
            Process process = processBuilder.start();
            
            // 读取输出
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }
            
            // 等待进程完成
            int exitCode = process.waitFor();
            
            if (exitCode != 0) {
                logger.error("生成预览图片失败: {}", output.toString());
                return useDefaultPreview(outputImagePath);
            }
            
            logger.info("生成预览图片成功: {}", outputImagePath);
            return true;
            
        } catch (Exception e) {
            logger.error("生成预览图片异常", e);
            return useDefaultPreview(outputImagePath);
        }
    }
    
    private boolean useDefaultPreview(String outputImagePath) {
        try {
            // 复制默认预览图片
            Path defaultPreviewPath = Paths.get("src/main/resources/static/images/default-neuron.png");
            if (!Files.exists(defaultPreviewPath)) {
                defaultPreviewPath = Paths.get("../frontend/public/models/default-neuron.png");
            }
            
            if (Files.exists(defaultPreviewPath)) {
                Files.copy(defaultPreviewPath, Paths.get(outputImagePath), StandardCopyOption.REPLACE_EXISTING);
                logger.info("已使用默认预览图片: {}", outputImagePath);
                return true;
            } else {
                logger.error("默认预览图片不存在");
                return false;
            }
        } catch (Exception e) {
            logger.error("使用默认预览图片失败", e);
            return false;
        }
    }
} 