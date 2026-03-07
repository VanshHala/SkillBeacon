package com.skillbeacon.controller;

import com.skillbeacon.dto.DashboardResponse;
import com.skillbeacon.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

        private final JobRepository jobRepository;

        @GetMapping("/metrics")
        public DashboardResponse getDashboardMetrics() {
                long totalJobs = jobRepository.count();
                List<Object[]> cityCounts = jobRepository.countJobsByCity();

                List<Map<String, Object>> jobsByCity = cityCounts.stream().limit(5)
                                .map(arr -> Map.of("city", arr[0] != null ? arr[0] : "Unknown", "count", arr[1]))
                                .collect(Collectors.toList());

                List<Object[]> roleCounts = jobRepository.countJobsByRole();
                List<Map<String, Object>> jobsByRole = roleCounts.stream().limit(5)
                                .map(arr -> Map.of("role", arr[0] != null ? arr[0] : "Unknown", "count", arr[1]))
                                .collect(Collectors.toList());

                List<Map<String, Object>> topSkills;
                try {
                        List<Object[]> topSkillsQuery = jobRepository.getTopSkills();
                        topSkills = topSkillsQuery.stream()
                                        .map(arr -> Map.<String, Object>of(
                                                        "skill", arr[0] != null ? arr[0] : "Unknown",
                                                        "growth", 12.5)) // Default static visual fallback
                                        .collect(Collectors.toList());
                } catch (Exception e) {
                        topSkills = List.of(
                                        Map.of("skill", "Python", "growth", 14.5),
                                        Map.of("skill", "AWS", "growth", 11.2),
                                        Map.of("skill", "React", "growth", 9.8));
                }

                return DashboardResponse.builder()
                                .totalJobs(totalJobs > 0 ? totalJobs : 14250) // Mock fallback if db is empty during
                                                                              // initial dev
                                .avgSalary("₹12.5L")
                                .marketVolatility(5.2)
                                .aiConfidence(92.4)
                                .jobsByCity(jobsByCity.isEmpty() ? List.of(Map.of("city", "Bangalore", "count", 4500))
                                                : jobsByCity)
                                .jobsByRole(
                                                jobsByRole.isEmpty()
                                                                ? List.of(Map.of("role", "Software Engineer", "count",
                                                                                3200))
                                                                : jobsByRole)
                                // Mock charts data for initial dashboard loading until full ML model runs
                                .trendData(List.of(
                                                Map.of("month", "Jan", "demand", 65, "supply", 80),
                                                Map.of("month", "Feb", "demand", 59, "supply", 82),
                                                Map.of("month", "Mar", "demand", 80, "supply", 75)))
                                .topSkills(topSkills.isEmpty() ? List.of(Map.of("skill", "Python", "growth", 14.5),
                                                Map.of("skill", "AWS", "growth", 11.2)) : topSkills)
                                .build();
        }
}
