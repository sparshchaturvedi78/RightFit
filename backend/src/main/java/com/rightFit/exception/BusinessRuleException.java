package com.rightFit.exception;

public class BusinessRuleException extends RbacException {

    public static final String CAPACITY_EXCEEDED = "CAPACITY_EXCEEDED";

    public BusinessRuleException(String message) {
        super("BUSINESS_RULE_VIOLATION", message);
    }

    public BusinessRuleException(String errorCode, String message) {
        super(errorCode, message);
    }
}
