package com.morphtesser.dto;

import java.util.Date;
import lombok.Data;

@Data
public class NeuronModelDTO {
    private Long id;
    private String name;
    private String username; // 只包含用户名而不是整个用户对象
    private Date createdAt;
    private String filePath;
    private String objPath;
    private Double length;
    private Double surfaceArea;
    private Double volume;
    private String objFilePath;
    private String previewImagePath;
    // 新增前端可用的HTTP路径
    private String swcUrl;
    private String objUrl;
} 