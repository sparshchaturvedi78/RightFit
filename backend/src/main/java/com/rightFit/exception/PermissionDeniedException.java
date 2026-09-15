package com.rightFit.exception;

public class PermissionDeniedException extends RbacException {
    public PermissionDeniedException(String permission) {
        super("PERMISSION_DENIED", "User does not have permission: " + permission);
    }

    public PermissionDeniedException(String permission, String message) {
        super("PERMISSION_DENIED", message);
    }
}
