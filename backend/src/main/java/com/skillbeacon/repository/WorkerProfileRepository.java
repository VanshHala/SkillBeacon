package com.skillbeacon.repository;

import com.skillbeacon.model.WorkerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, Long> {
    List<WorkerProfile> findByUserId(Long userId);
}
