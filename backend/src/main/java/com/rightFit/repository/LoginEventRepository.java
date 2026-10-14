package com.rightFit.repository;

import com.rightFit.entity.LoginEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginEventRepository extends JpaRepository<LoginEvent, Long> {

    /** [day (yyyy-mm-dd), sign-in count] for sign-ins on or after {@code since}. Days with no sign-ins are absent. */
    @Query(value = "SELECT CAST(signed_in_at AS date), COUNT(*) FROM login_events " +
            "WHERE signed_in_at >= :since GROUP BY CAST(signed_in_at AS date) ORDER BY CAST(signed_in_at AS date)",
            nativeQuery = true)
    List<Object[]> countPerDaySince(@Param("since") LocalDateTime since);
}
