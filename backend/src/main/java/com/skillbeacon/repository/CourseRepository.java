package com.skillbeacon.repository;

import com.skillbeacon.model.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByPlatformIgnoreCase(String platform);

    Page<Course> findByPlatformIgnoreCase(String platform, Pageable pageable);

    Page<Course> findByLevelIgnoreCase(String level, Pageable pageable);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM courses WHERE skills_covered @> :skill::jsonb", nativeQuery = true)
    List<Course> findBySkillCovered(@org.springframework.data.repository.query.Param("skill") String skill);
}
