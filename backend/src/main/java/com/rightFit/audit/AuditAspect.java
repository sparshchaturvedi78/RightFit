package com.rightFit.audit;

import com.rightFit.security.SecurityContextUtil;
import com.rightFit.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditLogService auditLogService;

    @Around("@annotation(auditable)")
    @Transactional
    public Object auditMethod(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        String[] paramNames = signature.getParameterNames();
        Object[] paramValues = joinPoint.getArgs();

        Map<String, Object> params = new HashMap<>();
        for (int i = 0; i < paramNames.length; i++) {
            params.put(paramNames[i], paramValues[i]);
        }

        Long userId = SecurityContextUtil.getCurrentUserId();
        String action = auditable.action();
        String entityType = auditable.entityType();
        Long entityId = extractLongParam(params, auditable.entityIdParamName());
        Object beforeState = extractParam(params, auditable.beforeStateParamName());
        Object context = extractParam(params, auditable.contextParamName());

        try {
            Object result = joinPoint.proceed();
            Object afterState = extractParam(params, auditable.afterStateParamName());
            if (afterState == null) {
                afterState = result;
            }

            if (userId != null) {
                auditLogService.logAction(userId, action, entityType, entityId, beforeState, afterState,
                        context != null ? context.toString() : null);
            } else {
                log.warn("Cannot audit method {} - user not authenticated", method.getName());
            }
            return result;
        } catch (Exception e) {
            log.error("Error in audited method: {}.{}", signature.getDeclaringType().getSimpleName(),
                    method.getName(), e);
            throw e;
        }
    }

    private Long extractLongParam(Map<String, Object> params, String paramName) {
        if (paramName == null || paramName.isEmpty()) {
            return null;
        }
        Object value = params.get(paramName);
        if (value instanceof Long) {
            return (Long) value;
        } else if (value instanceof String) {
            try {
                return Long.parseLong((String) value);
            } catch (NumberFormatException e) {
                log.warn("Could not parse Long from param: {}", paramName);
            }
        }
        return null;
    }

    private Object extractParam(Map<String, Object> params, String paramName) {
        if (paramName == null || paramName.isEmpty()) {
            return null;
        }
        return params.get(paramName);
    }
}
