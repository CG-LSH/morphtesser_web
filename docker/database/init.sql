-- 初始化 MorphTesser Web 数据库（仅在空库时执行）
CREATE DATABASE IF NOT EXISTS morphtesserdb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE morphtesserdb;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME,
    updated_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 神经元模型表
CREATE TABLE IF NOT EXISTS neuron_models (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    species VARCHAR(255) NOT NULL,
    brain_region VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    created_at DATETIME,
    updated_at DATETIME,
    file_path VARCHAR(1024),
    obj_path VARCHAR(1024),
    length DOUBLE,
    surface_area DOUBLE,
    volume DOUBLE,
    obj_file_path VARCHAR(1024),
    draco_file_path VARCHAR(1024),
    compression_ratio DOUBLE,
    preview_image_path VARCHAR(1024),
    is_public BIT(1) NOT NULL DEFAULT 0,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_neuron_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 历史模型表（兼容旧逻辑）
CREATE TABLE IF NOT EXISTS models (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    file_path VARCHAR(1024),
    description TEXT,
    type VARCHAR(100),
    species VARCHAR(100),
    brain_region VARCHAR(100),
    user_id BIGINT,
    obj_file_path VARCHAR(1024),
    created_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 预置管理员账户（密码：admin123）
INSERT INTO users (username, email, password, created_at, updated_at)
SELECT 'admin', 'admin@example.com',
       '$2a$10$Dow1s4VbQJu1WDxhY/fxAO6JqqPiFZUvBeIV/pY5Pja/qvpDMAYA.',
       NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'admin'
);

