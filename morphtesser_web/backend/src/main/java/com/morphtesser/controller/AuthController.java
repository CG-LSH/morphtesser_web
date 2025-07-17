package com.morphtesser.controller;

import com.morphtesser.model.User;
import com.morphtesser.repository.UserRepository;
import com.morphtesser.security.UserDetailsImpl;
import com.morphtesser.service.UserService;
import com.morphtesser.security.JwtUtils;
import com.morphtesser.payload.response.JwtResponse;
import com.morphtesser.payload.request.LoginRequest;
import com.morphtesser.payload.response.MessageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        return userService.registerUser(user);
    }

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            logger.info("接收到登录请求: username={}", loginRequest.getUsername());
            
            if (!userRepository.existsByUsername(loginRequest.getUsername())) {
                logger.warn("用户不存在: {}", loginRequest.getUsername());
                return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("用户名或密码错误"));
            }
            
            logger.debug("尝试认证用户: {}", loginRequest.getUsername());
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getUsername(),
                    loginRequest.getPassword()
                )
            );
            
            logger.debug("用户认证成功，生成JWT令牌");
            String jwt = jwtUtils.generateJwtToken(authentication);
            
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            logger.info("登录成功: {}", userDetails.getUsername());
            return ResponseEntity.ok(new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail()
            ));
            
        } catch (AuthenticationException e) {
            logger.error("认证失败: {}", e.getMessage());
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new MessageResponse("用户名或密码错误"));
        } catch (Exception e) {
            logger.error("登录处理失败: ", e);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("服务器内部错误: " + e.getMessage()));
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String token) {
        logger.info("验证令牌");
        
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("无效的令牌格式");
        }
        
        String jwtToken = token.substring(7);
        
        if (jwtUtils.validateJwtToken(jwtToken)) {
            String username = jwtUtils.getUserNameFromJwtToken(jwtToken);
            return ResponseEntity.ok(Map.of(
                "valid", true,
                "username", username
            ));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("令牌已过期或无效");
        }
    }
} 