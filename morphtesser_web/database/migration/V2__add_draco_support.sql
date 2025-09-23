-- 添加Draco压缩文件支持
-- 为neuron_models表添加draco_file_path和compression_ratio字段

ALTER TABLE neuron_models 
ADD COLUMN draco_file_path VARCHAR(500) NULL COMMENT 'Draco压缩文件路径',
ADD COLUMN compression_ratio DOUBLE NULL COMMENT '压缩比率';

-- 添加索引以提高查询性能
CREATE INDEX idx_neuron_models_draco_file_path ON neuron_models(draco_file_path);
CREATE INDEX idx_neuron_models_compression_ratio ON neuron_models(compression_ratio);

-- 更新现有记录的压缩比率（如果有OBJ文件但没有Draco文件）
UPDATE neuron_models 
SET compression_ratio = 0.0 
WHERE obj_file_path IS NOT NULL AND draco_file_path IS NULL; 