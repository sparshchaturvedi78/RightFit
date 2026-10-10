package com.rightFit.exception;

public class ResourceNotFoundException extends RbacException {
    public ResourceNotFoundException(String entityType, String identifier) {
        super("RESOURCE_NOT_FOUND", entityType + " not found: " + identifier);
    }
}
