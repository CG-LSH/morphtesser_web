package com.morphtesser.service;

import java.nio.file.Path;

public interface ModelPreviewService {
    /**
     * 从OBJ模型生成预览图片
     * @param objFilePath OBJ文件路径
     * @param outputImagePath 输出图片路径
     * @return 是否成功生成
     */
    boolean generatePreviewImage(String objFilePath, String outputImagePath);
} 