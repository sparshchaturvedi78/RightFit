package com.rightFit.repository;

import com.rightFit.entity.LoginAudit;
import com.rightFit.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginAuditRepository extends JpaRepository<LoginAudit, Long> {

    List<LoginAudit> findByUserOrderByLoginTimestampDesc(User user);

    Page<LoginAudit> findByUserOrderByLoginTimestampDesc(User user, Pageable pageable);

    List<LoginAudit> findByEmailOrderByLoginTimestampDesc(String email);

    List<LoginAudit> findByLoginStatusAndLoginTimestampAfter(String loginStatus, LocalDateTime dateTime);

    Page<LoginAudit> findByLoginStatusOrderByLoginTimestampDesc(String loginStatus, Pageable pageable);
}
