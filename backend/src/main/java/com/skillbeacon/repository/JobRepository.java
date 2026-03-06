package com.skillbeacon.repository;

import com.skillbeacon.model.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long> {
    Page<Job> findByLocationCityContainingIgnoreCase(String city, Pageable pageable);

    @Query("SELECT j FROM Job j WHERE LOWER(j.jobTitle) LIKE LOWER(CONCAT('%', :title, '%'))")
    Page<Job> searchByTitle(@Param("title") String title, Pageable pageable);

    @Query("SELECT j.locationCity, COUNT(j) FROM Job j GROUP BY j.locationCity ORDER BY COUNT(j) DESC")
    List<Object[]> countJobsByCity();

    @Query("SELECT j.jobTitle, COUNT(j) FROM Job j GROUP BY j.jobTitle ORDER BY COUNT(j) DESC")
    List<Object[]> countJobsByRole();

    @Query(value = "SELECT j.source_platform, COUNT(*) FROM jobs j GROUP BY j.source_platform", nativeQuery = true)
    List<Object[]> countJobsByPlatform();

    long countBySourcePlatform(String platform);
}
