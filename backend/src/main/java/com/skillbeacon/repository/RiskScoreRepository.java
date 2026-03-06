package com.skillbeacon.repository;

import com.skillbeacon.model.RiskScore;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RiskScoreRepository extends JpaRepository<RiskScore, Long> {
    List<RiskScore> findByProfileId(Long profileId);

    Optional<RiskScore> findTopByProfileIdOrderByCreatedAtDesc(Long profileId);
}
