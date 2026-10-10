package com.rightFit.exception;

public class ProjectAccessDeniedException extends RbacException {

    public static final String NOT_OWNED = "PROJECT_NOT_OWNED";
    public static final String NOT_CLAIMED = "PROJECT_NOT_CLAIMED";
    public static final String RESPONSIBILITY_REQUIRED = "RESPONSIBILITY_REQUIRED";
    public static final String RMG_FORBIDDEN = "RMG_INTERVIEW_FORBIDDEN";
    public static final String NOT_YOURS = "NOT_YOUR_RECORD";

    private ProjectAccessDeniedException(String errorCode, String message) {
        super(errorCode, message);
    }

    public static ProjectAccessDeniedException notOwned(String projectId) {
        return new ProjectAccessDeniedException(NOT_OWNED,
                "You are not the Manager of project " + projectId);
    }

    public static ProjectAccessDeniedException notClaimed(String projectId) {
        return new ProjectAccessDeniedException(NOT_CLAIMED,
                "You must claim project " + projectId + " before working on its requirements");
    }

    public static ProjectAccessDeniedException responsibilityRequired(String requirementId, String responsibility) {
        return new ProjectAccessDeniedException(RESPONSIBILITY_REQUIRED,
                "Only the project's Manager or an assigned " + responsibility + " can do this on " + requirementId);
    }

    public static ProjectAccessDeniedException rmgForbidden() {
        return new ProjectAccessDeniedException(RMG_FORBIDDEN, "RMG cannot participate in interviews");
    }

    public static ProjectAccessDeniedException notYours(String what) {
        return new ProjectAccessDeniedException(NOT_YOURS, what + " does not belong to you");
    }
}
