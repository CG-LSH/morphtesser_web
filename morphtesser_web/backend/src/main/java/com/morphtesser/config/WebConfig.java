package com.morphtesser.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${dataset.upload.base-dir:/app/uploads}")
    private String datasetUploadBaseDir;

    private String toFileLocation(Path path) {
        String uri = path.toAbsolutePath().normalize().toUri().toString();
        return uri.endsWith("/") ? uri : uri + "/";
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/favicon.ico")
               .addResourceLocations("classpath:/static/", "classpath:/public/", "classpath:/META-INF/resources/");
        
        registry.addResourceHandler("/static/**")
               .addResourceLocations("classpath:/static/", "classpath:/public/", "classpath:/META-INF/resources/");

        registry.addResourceHandler("/*.png")
               .addResourceLocations("classpath:/static/", "classpath:/public/");

        String uploadLocation = toFileLocation(Paths.get(datasetUploadBaseDir));

        // SWC / OBJ / Draco 文件映射（使用可配置路径）
        registry.addResourceHandler("/uploads/swc/**")
                .addResourceLocations(uploadLocation);
        registry.addResourceHandler("/uploads/obj/**")
                .addResourceLocations(uploadLocation);
        registry.addResourceHandler("/uploads/draco/**")
                .addResourceLocations(uploadLocation);
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // 为前端路由添加视图控制器，确保React Router能处理路由
        registry.addViewController("/embed/**").setViewName("forward:/index.html");
    }
} 