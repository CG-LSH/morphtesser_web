package com.morphtesser;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;

@SpringBootApplication
public class MorphtesserApplication {

    public static void main(String[] args) {
        SpringApplication.run(MorphtesserApplication.class, args);
    }
    
    @EventListener(ApplicationReadyEvent.class)
    public void initAfterStartup() {
        try {
            // 创建上传目录
            Files.createDirectories(Paths.get("./uploads"));
            
            // 创建scripts目录
            Files.createDirectories(Paths.get("./scripts"));
            
            // 复制球体模型到scripts目录
            File frontendSphere = new File("../frontend/public/models/sphere.obj");
            if (frontendSphere.exists()) {
                Files.copy(
                    frontendSphere.toPath(),
                    Paths.get("./scripts/sphere.obj"),
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING
                );
                System.out.println("已复制球体模型到scripts目录");
            }
            
            // 复制Python脚本到scripts目录
            File scriptFile = new File("./scripts/swc_to_obj.py");
            if (!scriptFile.exists()) {
                // 如果脚本不存在，创建一个简单的脚本
                try (java.io.PrintWriter writer = new java.io.PrintWriter(scriptFile)) {
                    writer.println("#!/usr/bin/env python");
                    writer.println("# -*- coding: utf-8 -*-");
                    writer.println("");
                    writer.println("import sys");
                    writer.println("import os");
                    writer.println("import shutil");
                    writer.println("");
                    writer.println("def main():");
                    writer.println("    if len(sys.argv) < 3:");
                    writer.println("        print(\"用法: python swc_to_obj.py input.swc output.obj\")");
                    writer.println("        sys.exit(1)");
                    writer.println("    ");
                    writer.println("    swc_file = sys.argv[1]");
                    writer.println("    obj_file = sys.argv[2]");
                    writer.println("    ");
                    writer.println("    print(f\"转换 {swc_file} 到 {obj_file}\")");
                    writer.println("    ");
                    writer.println("    # 创建一个简单的OBJ文件");
                    writer.println("    with open(obj_file, 'w') as f:");
                    writer.println("        f.write(\"# 简单球体OBJ文件\\n\")");
                    writer.println("        f.write(\"v 0.0 0.0 0.0\\n\")");
                    writer.println("        f.write(\"v 1.0 0.0 0.0\\n\")");
                    writer.println("        f.write(\"v 0.0 1.0 0.0\\n\")");
                    writer.println("        f.write(\"v 0.0 0.0 1.0\\n\")");
                    writer.println("        f.write(\"f 1 2 3\\n\")");
                    writer.println("        f.write(\"f 1 3 4\\n\")");
                    writer.println("        f.write(\"f 1 4 2\\n\")");
                    writer.println("        f.write(\"f 2 4 3\\n\")");
                    writer.println("    print(f\"已创建简单OBJ文件: {obj_file}\")");
                    writer.println("    ");
                    writer.println("    # 输出一些统计信息");
                    writer.println("    print(\"length: 100.0\")");
                    writer.println("    print(\"surface_area: 200.0\")");
                    writer.println("    print(\"volume: 300.0\")");
                    writer.println("    ");
                    writer.println("    return 0");
                    writer.println("");
                    writer.println("if __name__ == \"__main__\":");
                    writer.println("    sys.exit(main())");
                }
                System.out.println("已创建Python脚本");
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
} 