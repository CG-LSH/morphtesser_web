package com.morphtesser.service;

import java.util.Map;

public interface PythonService {
    
    /**
     * 将SWC文件转换为OBJ文件
     * 
     * @param swcFilePath SWC文件路径
     * @return 包含转换结果的Map，包括OBJ文件路径和统计数据
     */
    Map<String, Object> convertSwcToObj(String swcFilePath);

    /**
     * 将OBJ文件压缩为Draco格式
     * 
     * @param objFilePath OBJ文件路径
     * @return 包含压缩结果的Map，包括压缩文件路径和压缩统计
     */
    Map<String, Object> compressObjToDraco(String objFilePath);

    Map<String, Object> processSWCFile(String filePath);
} 