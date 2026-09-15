package com.rightFit.security;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
public class AuthorizationAspect {

    @Around("@annotation(org.springframework.security.access.prepost.PreAuthorize)")
    public Object logAuthorizationCheck(ProceedingJoinPoint joinPoint) throws Throwable {
        Long userId = SecurityContextUtil.getCurrentUserId();
        String methodName = joinPoint.getSignature().getName();

        try {
            log.debug("Authorization check - User: {}, Method: {}", userId, methodName);
            Object result = joinPoint.proceed();
            log.debug("Authorization granted - User: {}, Method: {}", userId, methodName);
            return result;
        } catch (AccessDeniedException e) {
            log.warn("Authorization denied - User: {}, Method: {}, Reason: {}", userId, methodName, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Authorization error - User: {}, Method: {}, Error: {}", userId, methodName, e.getMessage());
            throw e;
        }
    }
}
