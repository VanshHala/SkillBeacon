package com.skillbeacon.repository;

import com.skillbeacon.model.AnalyticsSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AnalyticsSnapshotRepository extends JpaRepository<AnalyticsSnapshot, Long> {
    Optional<AnalyticsSnapshot> findTopBySnapshotTypeOrderByCreatedAtDesc(String snapshotType);
}
