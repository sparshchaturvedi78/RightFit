package com.rightFit.exception;

public class LastAdminException extends RbacException {
    public LastAdminException() {
        super("LAST_ADMIN_PROTECTED", "Cannot remove the last active admin user from the system");
    }

    public LastAdminException(String message) {
        super("LAST_ADMIN_PROTECTED", message);
    }
}
