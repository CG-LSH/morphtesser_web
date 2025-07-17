package com.morphtesser.service;

import com.morphtesser.model.User;
import org.springframework.http.ResponseEntity;

public interface UserService {
    ResponseEntity<?> registerUser(User user);
    ResponseEntity<?> loginUser(User user);
    ResponseEntity<?> getUserProfile(String token);
    User findByUsername(String username);
} 