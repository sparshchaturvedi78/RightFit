package com.rightFit.exception;

public class SystemRoleModificationException extends RbacException {
    public SystemRoleModificationException(String roleName) {
        super("SYSTEM_ROLE_IMMUTABLE", "Cannot modify system role: " + roleName);
    }

    public SystemRoleModificationException(String roleName, String message) {
        super("SYSTEM_ROLE_IMMUTABLE", message);
    }
}
