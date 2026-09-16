package com.rightFit.exception;

public abstract class RbacException extends RuntimeException {
    private final String errorCode;

    public RbacException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public RbacException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
