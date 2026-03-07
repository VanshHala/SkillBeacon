package com.skillbeacon.controller;

import com.skillbeacon.model.Job;
import com.skillbeacon.repository.JobRepository;
import com.skillbeacon.service.MarketIntelligenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final JobRepository jobRepository;
    private final MarketIntelligenceService marketIntelligenceService;

    // ─── Existing basic endpoints ───

    @GetMapping("/jobs")
    public Page<Job> getJobs(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return jobRepository.findAll(PageRequest.of(page, size));
    }

    @GetMapping("/cities")
    public List<Map<String, Object>> getCities() {
        return jobRepository.countJobsByCity().stream()
                .map(arr -> Map.<String, Object>of("city", arr[0] != null ? arr[0] : "Unknown", "count", arr[1]))
                .collect(Collectors.toList());
    }

    @GetMapping("/roles")
    public List<Map<String, Object>> getRoles() {
        return jobRepository.countJobsByRole().stream()
                .map(arr -> Map.<String, Object>of("role", arr[0] != null ? arr[0] : "Unknown", "count", arr[1]))
                .collect(Collectors.toList());
    }

    @GetMapping("/skills")
    public List<Map<String, Object>> getSkills() {
        try {
            return jobRepository.getTopSkills().stream()
                    .map(arr -> Map.<String, Object>of("skill", arr[0] != null ? arr[0] : "Unknown", "count", arr[1]))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return List.of();
        }
    }

    // ─── Layer 1: Market Intelligence Endpoints ───

    /**
     * Tab A: Hiring Trends — job volumes by city + sector for 7d/30d/90d windows.
     */
    @GetMapping("/hiring-trends")
    public Map<String, Object> getHiringTrends(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String city) {
        return marketIntelligenceService.getHiringTrends(days, category, city);
    }

    /**
     * Tab B: Skills Intelligence — top 20 rising and declining skills (WoW) + top
     * skills (30d).
     */
    @GetMapping("/skills-intelligence")
    public Map<String, Object> getSkillsIntelligence() {
        return marketIntelligenceService.getSkillsIntelligence();
    }

    /**
     * Tab C: AI Vulnerability Index — score 0-100 per normalized category.
     * Supports optional city filter for heatmap mode.
     */
    @GetMapping("/ai-vulnerability")
    public List<Map<String, Object>> getAIVulnerabilityIndex(
            @RequestParam(required = false) String city) {
        return marketIntelligenceService.getAIVulnerabilityIndex(city);
    }

    /**
     * Categories listing (for filters).
     */
    @GetMapping("/categories")
    public List<Map<String, Object>> getCategories() {
        return jobRepository.countJobsByCategory().stream()
                .map(arr -> Map.<String, Object>of("category", arr[0] != null ? arr[0] : "Unknown", "count", arr[1]))
                .collect(Collectors.toList());
    }
}
