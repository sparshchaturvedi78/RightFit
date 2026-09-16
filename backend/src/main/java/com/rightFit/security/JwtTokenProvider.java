package com.rightFit.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration:86400000}") // 24 hours default
    private long jwtExpirationMs;

    @Value("${app.jwt.refresh-expiration:604800000}") // 7 days default
    private long refreshTokenExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generate JWT Access Token
     */
    public String generateAccessToken(Long userId, String employeeId, String email, Set<String> roles) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("employeeId", employeeId);
        claims.put("roles", roles);

        return createToken(claims, email, jwtExpirationMs);
    }

    /**
     * Generate JWT Refresh Token
     */
    public String generateRefreshToken(Long userId, String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("type", "REFRESH");

        return createToken(claims, email, refreshTokenExpirationMs);
    }

    /**
     * Create JWT Token
     */
    private String createToken(Map<String, Object> claims, String subject, long expirationTime) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationTime);

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Get Email from Token
     */
    public String getEmailFromToken(String token) {
        return getAllClaimsFromToken(token).getSubject();
    }

    /**
     * Get User ID from Token
     */
    public Long getUserIdFromToken(String token) {
        Object userId = getAllClaimsFromToken(token).get("userId");
        return userId != null ? ((Number) userId).longValue() : null;
    }

    /**
     * Get Roles from Token
     */
    public Set<String> getRolesFromToken(String token) {
        Object rolesObj = getAllClaimsFromToken(token).get("roles");
        if (rolesObj == null) {
            return new HashSet<>();
        }
        if (rolesObj instanceof Set) {
            return (Set<String>) rolesObj;
        }
        if (rolesObj instanceof List) {
            return new HashSet<>((List<String>) rolesObj);
        }
        return new HashSet<>();
    }

    /**
     * Get All Claims from Token
     */
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Validate Token
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SecurityException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("Expired JWT token: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("Unsupported JWT token: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Check if Token is Expired
     */
    public boolean isTokenExpired(String token) {
        try {
            Date expiration = getAllClaimsFromToken(token).getExpiration();
            return expiration.before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    /**
     * Get Expiration Time in Milliseconds (from now)
     */
    public long getExpirationTimeMs() {
        return jwtExpirationMs;
    }

    /**
     * Get Expiration Time in Seconds (from now)
     */
    public long getExpirationTimeSecs() {
        return jwtExpirationMs / 1000;
    }
}
