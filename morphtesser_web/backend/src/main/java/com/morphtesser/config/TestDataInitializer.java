package com.morphtesser.config;

import com.morphtesser.model.User;
import com.morphtesser.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class TestDataInitializer {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Bean
    public CommandLineRunner initTestData() {
        return args -> {
            // 如果没有用户，创建一个测试用户
            if (userRepository.count() == 0) {
                User testUser = new User();
                testUser.setUsername("test");
                testUser.setEmail("test@example.com");
                testUser.setPassword(passwordEncoder.encode("password"));
                userRepository.save(testUser);
                
        
            }
        };
    }
} 