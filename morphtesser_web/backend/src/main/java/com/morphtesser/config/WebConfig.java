package com.morphtesser.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/favicon.ico")
               .addResourceLocations("classpath:/static/", "classpath:/public/", "classpath:/META-INF/resources/");
        
        registry.addResourceHandler("/static/**")
               .addResourceLocations("classpath:/static/", "classpath:/public/", "classpath:/META-INF/resources/");

        registry.addResourceHandler("/*.png")
               .addResourceLocations("classpath:/static/", "classpath:/public/");

         // SWC 文件映射
        registry.addResourceHandler("/uploads/swc/**")
                .addResourceLocations("file:/Z:/lsh/morphtesser_exp/DataSet/LSH/");
        // OBJ 文件映射（如果需要）
        registry.addResourceHandler("/uploads/obj/**")
                .addResourceLocations("file:/Z:/lsh/morphtesser_exp/DataSet/LSH/");
    }
} 