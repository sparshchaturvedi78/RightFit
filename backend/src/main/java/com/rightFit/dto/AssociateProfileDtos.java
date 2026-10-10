package com.rightFit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Associate self-service profile DTOs: skills, certifications, preferences, availability (BRD 18-21). */
public final class AssociateProfileDtos {

    private AssociateProfileDtos() {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateProfileRequest {
        private String phone;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddEmployeeSkillRequest {
        @NotBlank(message = "Skill name is required")
        private String skillName;
        @NotNull(message = "Proficiency level is required")
        @Min(value = 1, message = "Proficiency level must be between 1 and 10")
        @Max(value = 10, message = "Proficiency level must be between 1 and 10")
        private Integer proficiencyLevel;
        private Integer yearsOfExperience;
        private LocalDate lastUsedDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateEmployeeSkillRequest {
        @Min(value = 1, message = "Proficiency level must be between 1 and 10")
        @Max(value = 10, message = "Proficiency level must be between 1 and 10")
        private Integer proficiencyLevel;
        private Integer yearsOfExperience;
        private LocalDate lastUsedDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class EmployeeSkillDTO {
        private Long id;
        private Long skillId;
        private String skillName;
        private String category;
        private Integer proficiencyLevel;
        private Integer yearsOfExperience;
        private LocalDate lastUsedDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class EmployeeCertificationDTO {
        private Long id;
        private Long certificationId;
        private String certificationName;
        private String issuingOrganization;
        private LocalDate obtainedDate;
        private LocalDate expiryDate;
        private Boolean isValid;
        private String fileName;
        private String contentType;
        private Long fileSize;
        private Boolean hasDocument;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateEmployeePreferenceRequest {
        private String preferredTechnology;
        private String preferredDomain;
        private String preferredLocation;
        private String preferredWorkMode;
        private String preferredProjectType;
    }

    /** No @JsonInclude(NON_NULL) here, deliberately - all 5 fields always appear, null or not, so a
     * caller always knows the complete shape of their preferences without guessing which keys exist. */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmployeePreferenceDTO {
        private String preferredTechnology;
        private String preferredDomain;
        private String preferredLocation;
        private String preferredWorkMode;
        private String preferredProjectType;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RequestUnavailabilityRequest {
        @NotNull(message = "Expected return date is required")
        private LocalDate expectedReturnDate;
        @NotBlank(message = "Reason is required")
        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RejectAvailabilityRequest {
        @NotBlank(message = "Reason is required")
        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class EmployeeAvailabilityDTO {
        private Long id;
        private String employeeId;
        private String availabilityStatus;
        private LocalDate expectedReturnDate;
        private String reason;
        private String verificationStatus;
        private String verifiedByName;
        private LocalDateTime verifiedAt;
        private String verificationComment;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateSkillRequest {
        @NotBlank(message = "Skill name is required")
        private String skillName;
        private String category;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateSkillRequest {
        private String skillName;
        private String category;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SkillDTO {
        private Long id;
        private String skillName;
        private String category;
        private String description;
        private Boolean isActive;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateCertificationRequest {
        @NotBlank(message = "Certification name is required")
        private String certificationName;
        private String issuingOrganization;
        private String description;
        private Integer validYears;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateCertificationRequest {
        private String certificationName;
        private String issuingOrganization;
        private String description;
        private Integer validYears;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CertificationDTO {
        private Long id;
        private String certificationName;
        private String issuingOrganization;
        private String description;
        private Integer validYears;
        private Boolean isActive;
    }
}
