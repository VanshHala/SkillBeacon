package com.skillbeacon.repository;

import com.skillbeacon.model.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long> {

        // ─── Basic search queries ───
        Page<Job> findByLocationCityContainingIgnoreCase(String city, Pageable pageable);

        @Query("SELECT j FROM Job j WHERE LOWER(j.jobTitle) LIKE LOWER(CONCAT('%', :title, '%'))")
        Page<Job> searchByTitle(@Param("title") String title, Pageable pageable);

        @Query("SELECT j FROM Job j WHERE LOWER(j.jobTitle) LIKE LOWER(CONCAT('%', :title, '%')) AND LOWER(j.locationCity) LIKE LOWER(CONCAT('%', :city, '%'))")
        Page<Job> searchByTitleAndCity(@Param("title") String title, @Param("city") String city, Pageable pageable);

        // ─── Basic aggregations ───
        @Query("SELECT j.locationCity, COUNT(j) FROM Job j GROUP BY j.locationCity ORDER BY COUNT(j) DESC")
        List<Object[]> countJobsByCity();

        @Query("SELECT j.jobTitle, COUNT(j) FROM Job j GROUP BY j.jobTitle ORDER BY COUNT(j) DESC")
        List<Object[]> countJobsByRole();

        @Query("SELECT j.normalizedCategory, COUNT(j) FROM Job j GROUP BY j.normalizedCategory ORDER BY COUNT(j) DESC")
        List<Object[]> countJobsByCategory();

        // ─── Similar Jobs ───
        @Query("SELECT j FROM Job j WHERE j.normalizedCategory = :category AND LOWER(j.jobTitle) NOT LIKE LOWER(CONCAT('%', :excludeTitle, '%'))")
        Page<Job> findSimilarJobsByCategory(@Param("category") String category,
                        @Param("excludeTitle") String excludeTitle,
                        Pageable pageable);

        @Query("SELECT j FROM Job j WHERE j.normalizedCategory = :category AND LOWER(j.jobTitle) NOT LIKE LOWER(CONCAT('%', :excludeTitle, '%')) AND LOWER(j.locationCity) LIKE LOWER(CONCAT('%', :city, '%'))")
        Page<Job> findSimilarJobsByCategoryAndCity(@Param("category") String category,
                        @Param("excludeTitle") String excludeTitle, @Param("city") String city, Pageable pageable);

        @Query(value = "SELECT j.source_platform, COUNT(*) FROM jobs j GROUP BY j.source_platform", nativeQuery = true)
        List<Object[]> countJobsByPlatform();

        long countBySourcePlatform(String platform);

        // ─── Autocomplete suggestions ───
        @Query("SELECT DISTINCT j.locationCity FROM Job j WHERE LOWER(j.locationCity) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY j.locationCity")
        List<String> suggestCities(@Param("q") String q, Pageable pageable);

        @Query("SELECT DISTINCT j.jobTitle FROM Job j WHERE LOWER(j.jobTitle) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY j.jobTitle")
        List<String> suggestTitles(@Param("q") String q, Pageable pageable);

        boolean existsByJobUrl(String jobUrl);

        // ─── Top skills (JSONB) ───
        @Query(value = "SELECT skill, COUNT(*) FROM jobs, jsonb_array_elements_text(skills_required) as skill WHERE skills_required IS NOT NULL AND jsonb_typeof(skills_required) = 'array' AND jsonb_array_length(skills_required) > 0 GROUP BY skill ORDER BY COUNT(*) DESC LIMIT 10", nativeQuery = true)
        List<Object[]> getTopSkills();

        // ─── PHASE 2: Hiring Trends (by city + category within date range) ───
        @Query(value = "SELECT j.location_city, j.normalized_category, j.city_tier, COUNT(*) FROM jobs j WHERE j.job_posted_date >= :since AND (CAST(:category AS TEXT) IS NULL OR CAST(:category AS TEXT) = '' OR j.normalized_category = CAST(:category AS TEXT)) AND (CAST(:city AS TEXT) IS NULL OR CAST(:city AS TEXT) = '' OR j.location_city = CAST(:city AS TEXT)) GROUP BY j.location_city, j.normalized_category, j.city_tier ORDER BY COUNT(*) DESC", nativeQuery = true)
        List<Object[]> countJobsByCityAndCategorySince(@Param("since") LocalDate since,
                        @Param("category") String category, @Param("city") String city);

        @Query(value = "SELECT j.normalized_category, COUNT(*) FROM jobs j WHERE j.job_posted_date >= :since AND (CAST(:category AS TEXT) IS NULL OR CAST(:category AS TEXT) = '' OR j.normalized_category = CAST(:category AS TEXT)) AND (CAST(:city AS TEXT) IS NULL OR CAST(:city AS TEXT) = '' OR j.location_city = CAST(:city AS TEXT)) GROUP BY j.normalized_category ORDER BY COUNT(*) DESC", nativeQuery = true)
        List<Object[]> countJobsByCategorySince(@Param("since") LocalDate since, @Param("category") String category,
                        @Param("city") String city);

        @Query(value = "SELECT j.city_tier, COUNT(*) FROM jobs j WHERE j.job_posted_date >= :since AND (CAST(:category AS TEXT) IS NULL OR CAST(:category AS TEXT) = '' OR j.normalized_category = CAST(:category AS TEXT)) AND (CAST(:city AS TEXT) IS NULL OR CAST(:city AS TEXT) = '' OR j.location_city = CAST(:city AS TEXT)) GROUP BY j.city_tier ORDER BY COUNT(*) DESC", nativeQuery = true)
        List<Object[]> countJobsByCityTierSince(@Param("since") LocalDate since, @Param("category") String category,
                        @Param("city") String city);

        // ─── PHASE 2: Skill trends over windows ───
        @Query(value = "SELECT skill, COUNT(*) as cnt FROM jobs, jsonb_array_elements_text(extracted_skills) as skill WHERE extracted_skills IS NOT NULL AND jsonb_typeof(extracted_skills) = 'array' AND jsonb_array_length(extracted_skills) > 0 AND job_posted_date >= :since AND job_posted_date < :until GROUP BY skill ORDER BY cnt DESC", nativeQuery = true)
        List<Object[]> getSkillCountsInWindow(@Param("since") LocalDate since, @Param("until") LocalDate until);

        @Query(value = "SELECT skill, COUNT(*) as cnt FROM jobs, jsonb_array_elements_text(extracted_skills) as skill WHERE extracted_skills IS NOT NULL AND jsonb_typeof(extracted_skills) = 'array' AND jsonb_array_length(extracted_skills) > 0 AND job_posted_date >= :since GROUP BY skill ORDER BY cnt DESC LIMIT :lim", nativeQuery = true)
        List<Object[]> getTopSkillsSince(@Param("since") LocalDate since, @Param("lim") int limit);

        // ─── PHASE 2: AI Vulnerability — AI tool mentions per category ───
        @Query(value = "SELECT normalized_category, COUNT(*) FROM jobs WHERE ai_tool_mentions IS NOT NULL AND jsonb_typeof(ai_tool_mentions) = 'array' AND jsonb_array_length(ai_tool_mentions) > 0 AND (CAST(:city AS TEXT) IS NULL OR CAST(:city AS TEXT) = '' OR location_city = CAST(:city AS TEXT)) GROUP BY normalized_category", nativeQuery = true)
        List<Object[]> countJobsWithAIToolsByCategory(@Param("city") String city);

        @Query(value = "SELECT normalized_category, COUNT(*) FROM jobs WHERE (CAST(:city AS TEXT) IS NULL OR CAST(:city AS TEXT) = '' OR location_city = CAST(:city AS TEXT)) GROUP BY normalized_category", nativeQuery = true)
        List<Object[]> countTotalJobsByCategory(@Param("city") String city);

        // Hiring volume: recent period vs older period per category
        @Query(value = "SELECT normalized_category, COUNT(*) FROM jobs WHERE job_posted_date >= :since AND job_posted_date < :until AND (CAST(:city AS TEXT) IS NULL OR CAST(:city AS TEXT) = '' OR location_city = CAST(:city AS TEXT)) GROUP BY normalized_category", nativeQuery = true)
        List<Object[]> countJobsByCategoryInWindow(@Param("since") LocalDate since, @Param("until") LocalDate until,
                        @Param("city") String city);

        // ─── PHASE 3: Worker Intelligence — exact counts ───
        @Query("SELECT COUNT(j) FROM Job j WHERE LOWER(j.normalizedCategory) = LOWER(:category) AND LOWER(j.locationCity) LIKE LOWER(CONCAT('%', :city, '%'))")
        long countJobsByCategoryAndCity(@Param("category") String category, @Param("city") String city);

        @Query("SELECT COUNT(j) FROM Job j WHERE LOWER(j.jobTitle) LIKE LOWER(CONCAT('%', :title, '%')) AND LOWER(j.locationCity) LIKE LOWER(CONCAT('%', :city, '%'))")
        long countJobsByTitleAndCity(@Param("title") String title, @Param("city") String city);

        @Query("SELECT COUNT(j) FROM Job j WHERE LOWER(j.normalizedCategory) = LOWER(:category)")
        long countJobsByCategory(@Param("category") String category);

        @Query("SELECT j FROM Job j WHERE LOWER(j.normalizedCategory) = LOWER(:category) AND LOWER(j.locationCity) LIKE LOWER(CONCAT('%', :city, '%'))")
        List<Job> findByCategoryAndCity(@Param("category") String category, @Param("city") String city);
}
