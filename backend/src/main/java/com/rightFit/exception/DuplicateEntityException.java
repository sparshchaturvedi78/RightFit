package com.rightFit.exception;

public class DuplicateEntityException extends RbacException {
    public DuplicateEntityException(String entityType, String fieldName, String value) {
        super("DUPLICATE_ENTITY", entityType + " with " + fieldName + " '" + value + "' already exists");
    }

    public DuplicateEntityException(String message) {
        super("DUPLICATE_ENTITY", message);
    }
}
