package com.rightFit.repository;

import com.rightFit.entity.Certification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificationRepository extends JpaRepository<Certification, Long> {

    Optional<Certification> findByCertificationNameIgnoreCase(String certificationName);

    List<Certification> findByIsActiveTrueOrderByCertificationNameAsc();

    List<Certification> findAllByOrderByCertificationNameAsc();
}
