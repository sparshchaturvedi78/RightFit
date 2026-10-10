package com.rightFit.repository;

import com.rightFit.entity.BenchConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BenchConfigurationRepository extends JpaRepository<BenchConfiguration, Long> {

    Optional<BenchConfiguration> findFirstByIsActiveTrueOrderByEffectiveFromDesc();

    List<BenchConfiguration> findAllByOrderByEffectiveFromDesc();
}
