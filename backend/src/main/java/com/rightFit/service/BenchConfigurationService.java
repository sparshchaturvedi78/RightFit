package com.rightFit.service;

import com.rightFit.dto.PoolBenchDtos.BenchConfigurationDTO;
import com.rightFit.dto.PoolBenchDtos.CreateBenchConfigurationRequest;
import com.rightFit.entity.BenchConfiguration;
import com.rightFit.exception.BusinessRuleException;
import com.rightFit.repository.BenchConfigurationRepository;
import com.rightFit.security.SecurityContextUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Org-wide bench threshold policy (BRD 7.1). Admin sets it; RMG only reads it - the BRD doesn't
 * mandate this split, it's a proposed decision (see RMG_PHASE_GUIDE.md open questions). Only one
 * configuration is ever active at a time; creating a new one closes out the previous one.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BenchConfigurationService {

    private static final Long DEFAULT_ORGANIZATION_ID = 1L;

    private final BenchConfigurationRepository configRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public BenchConfigurationDTO current() {
        return toDTO(activeConfig());
    }

    @Transactional(readOnly = true)
    public List<BenchConfigurationDTO> history() {
        return configRepository.findAllByOrderByEffectiveFromDesc().stream().map(this::toDTO).toList();
    }

    public BenchConfigurationDTO create(CreateBenchConfigurationRequest request) {
        if (request.getGreenMaxDays() >= request.getRedThresholdDays()) {
            throw new BusinessRuleException("Green threshold must be less than the red threshold");
        }
        LocalDate effectiveFrom = request.getEffectiveFrom() != null ? request.getEffectiveFrom() : LocalDate.now();

        configRepository.findFirstByIsActiveTrueOrderByEffectiveFromDesc().ifPresent(previous -> {
            previous.setIsActive(false);
            previous.setEffectiveTo(effectiveFrom.minusDays(1));
            configRepository.save(previous);
        });

        BenchConfiguration config = configRepository.save(BenchConfiguration.builder()
                .organizationId(DEFAULT_ORGANIZATION_ID)
                .greenMaxDays(request.getGreenMaxDays())
                .amberMaxDays(request.getAmberMaxDays())
                .redThresholdDays(request.getRedThresholdDays())
                .effectiveFrom(effectiveFrom)
                .isActive(true)
                .build());

        log.info("New bench configuration effective {}: green<={}, amber<={}, red>={}",
                effectiveFrom, config.getGreenMaxDays(), config.getAmberMaxDays(), config.getRedThresholdDays());
        auditLogService.logAction(SecurityContextUtil.getCurrentUserId(), "BENCH_CONFIGURATION_CREATED",
                "BENCH_CONFIGURATION", config.getId(), null, null,
                "New bench policy effective " + effectiveFrom + ": green<=" + config.getGreenMaxDays()
                        + "d, amber<=" + config.getAmberMaxDays() + "d, red>=" + config.getRedThresholdDays() + "d");
        return toDTO(config);
    }

    private BenchConfiguration activeConfig() {
        return configRepository.findFirstByIsActiveTrueOrderByEffectiveFromDesc()
                .orElseThrow(() -> new BusinessRuleException("No active bench configuration is set"));
    }

    private BenchConfigurationDTO toDTO(BenchConfiguration config) {
        return BenchConfigurationDTO.builder()
                .id(config.getId())
                .greenMaxDays(config.getGreenMaxDays())
                .amberMaxDays(config.getAmberMaxDays())
                .redThresholdDays(config.getRedThresholdDays())
                .effectiveFrom(config.getEffectiveFrom())
                .effectiveTo(config.getEffectiveTo())
                .isActive(config.getIsActive())
                .build();
    }
}
