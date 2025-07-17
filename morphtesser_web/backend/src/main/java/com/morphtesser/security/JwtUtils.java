package com.morphtesser.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.security.core.Authentication;

import java.security.Key;
import java.util.Date;
import javax.crypto.SecretKey;
import java.util.Base64;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private int jwtExpirationMs;

    private SecretKey getSigningKey() {
        try {
            if (jwtSecret.length() >= 64) {
                return Keys.hmacShaKeyFor(jwtSecret.getBytes());
            } else {
                logger.warn("配置的JWT密钥长度不足，将使用自动生成的安全密钥");
                return Keys.secretKeyFor(SignatureAlgorithm.HS512);
            }
        } catch (Exception e) {
            logger.warn("使用配置的JWT密钥失败，将使用自动生成的安全密钥");
            return Keys.secretKeyFor(SignatureAlgorithm.HS512);
        }
    }

    public String generateJwtToken(Authentication authentication) {
        try {
            UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
            
            SecretKey key = getSigningKey();
            
            String token = Jwts.builder()
                    .setSubject((userPrincipal.getUsername()))
                    .setIssuedAt(new Date())
                    .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                    .signWith(key)
                    .compact();
            
            logger.debug("生成的JWT令牌: {}", token);
            return token;
        } catch (Exception e) {
            logger.error("生成JWT令牌失败: {}", e.getMessage(), e);
            throw new RuntimeException("无法生成JWT令牌: " + e.getMessage(), e);
        }
    }

    public String getUserNameFromJwtToken(String token) {
        try {
            SecretKey key = getSigningKey();
            
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (Exception e) {
            logger.error("从JWT令牌获取用户名失败: {}", e.getMessage(), e);
            return null;
        }
    }

    public boolean validateJwtToken(String authToken) {
        try {
            SecretKey key = getSigningKey();
            
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(authToken);
            return true;
        } catch (Exception e) {
            logger.error("JWT validation error: {}", e.getMessage(), e);
        }
        return false;
    }
} 