package com.morphtesser.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // 允许所有来源
        config.setAllowedOriginPatterns(Arrays.asList("*"));
        // 允许所有方法
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // 允许所有请求头
        config.setAllowedHeaders(Arrays.asList("*"));
        // 允许携带凭证
        config.setAllowCredentials(true);
        // 暴露的响应头
        config.setExposedHeaders(Arrays.asList("Content-Disposition"));
        
        // 对所有路径应用CORS配置
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }
}

