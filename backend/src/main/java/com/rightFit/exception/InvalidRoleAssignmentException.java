package com.rightFit.exception;

public class InvalidRoleAssignmentException extends RbacException {
    public InvalidRoleAssignmentException(String reason) {
        super("INVALID_ROLE_ASSIGNMENT", "Role assignment is invalid: " + reason);
    }

    public InvalidRoleAssignmentException(Long userId, String roleName) {
        super("INVALID_ROLE_ASSIGNMENT", "Cannot assign role '" + roleName + "' to user " + userId);
    }
}
