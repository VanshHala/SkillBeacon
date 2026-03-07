package com.skillbeacon.controller;

import com.skillbeacon.dto.ChatRequest;
import com.skillbeacon.dto.ChatResponse;
import com.skillbeacon.dto.WorkerAnalysisRequest;
import com.skillbeacon.dto.WorkerAnalysisResponse;
import com.skillbeacon.repository.JobRepository;
import com.skillbeacon.service.ChatbotService;
import com.skillbeacon.service.MarketIntelligenceService;
import com.skillbeacon.service.RiskAnalysisService;
import com.skillbeacon.service.WorkerAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/worker")
@RequiredArgsConstructor
public class WorkerIntelligenceController {

    private final WorkerAnalysisService workerAnalysisService;
    private final ChatbotService chatbotService;
    private final JobRepository jobRepository;
    private final RiskAnalysisService riskAnalysisService;
    private final MarketIntelligenceService marketIntelligenceService;

    @PostMapping("/analyze")
    public ResponseEntity<WorkerAnalysisResponse> analyzeProfile(
            @RequestBody WorkerAnalysisRequest request,
            Authentication authentication) {
        String clerkUserId = authentication.getName();
        WorkerAnalysisResponse response = workerAnalysisService.analyzeWorkerProfile(clerkUserId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(
            @RequestBody ChatRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        String reply = chatbotService.getChatResponse(request.getMessage(), userId);
        return ResponseEntity.ok(new ChatResponse(reply));
    }

    /**
     * Dynamic Risk Score endpoint.
     * Takes worker's city + normalized job title, retrieves the base AI
     * Vulnerability Index,
     * and adjusts based on their specific experience level.
     */
    @PostMapping("/risk-score")
    public ResponseEntity<Map<String, Object>> getDynamicRiskScore(
            @RequestBody Map<String, Object> request) {
        String jobTitle = (String) request.getOrDefault("jobTitle", "Software Engineer");
        String city = (String) request.getOrDefault("city", "");
        int experience = request.containsKey("yearsOfExperience")
                ? ((Number) request.get("yearsOfExperience")).intValue()
                : 0;

        @SuppressWarnings("unchecked")
        List<String> skills = request.containsKey("currentSkills")
                ? (List<String>) request.get("currentSkills")
                : List.of();

        double riskScore = riskAnalysisService.calculateRiskScore(jobTitle, city, experience, "", skills);
        String riskLevel = riskAnalysisService.determineRiskLevel(riskScore);
        String category = riskAnalysisService.normalizeToCategory(jobTitle);
        double avi = marketIntelligenceService.getAVIForCategory(category);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("jobTitle", jobTitle);
        result.put("normalizedCategory", category);
        result.put("city", city);
        result.put("riskScore", riskScore);
        result.put("riskLevel", riskLevel);
        result.put("aiVulnerabilityIndex", Math.round(avi * 10.0) / 10.0);
        result.put("totalJobsInCategory", jobRepository.countJobsByCategory(category));
        if (city != null && !city.isEmpty()) {
            result.put("jobsInCityForCategory", jobRepository.countJobsByCategoryAndCity(category, city));
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Reskilling Path Verifier.
     * Checks if a target role is actively hiring in the worker's specific city.
     */
    @PostMapping("/reskilling-check")
    public ResponseEntity<Map<String, Object>> checkReskillingPath(
            @RequestBody Map<String, String> request) {
        String targetRole = request.getOrDefault("targetRole", "");
        String city = request.getOrDefault("city", "");

        String normalizedTarget = riskAnalysisService.normalizeToCategory(targetRole);

        long exactCount = 0;
        long categoryCount = jobRepository.countJobsByCategory(normalizedTarget);

        if (!city.isEmpty()) {
            exactCount = jobRepository.countJobsByCategoryAndCity(normalizedTarget, city);
        }

        // Also search by raw title + city
        long titleCityCount = 0;
        if (!targetRole.isEmpty() && !city.isEmpty()) {
            titleCityCount = jobRepository.countJobsByTitleAndCity(targetRole, city);
        }

        boolean isHiring = exactCount > 0 || titleCityCount > 0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("targetRole", targetRole);
        result.put("normalizedCategory", normalizedTarget);
        result.put("city", city);
        result.put("isHiringInCity", isHiring);
        result.put("jobsInCityForCategory", exactCount);
        result.put("jobsInCityByTitle", titleCityCount);
        result.put("totalJobsInCategory", categoryCount);
        result.put("recommendation", isHiring
                ? "✅ " + normalizedTarget + " is actively hiring in " + city + " with " + (exactCount + titleCityCount)
                        + " open positions. This is a viable reskilling path."
                : "⚠️ No current openings found for " + normalizedTarget + " in " + city
                        + ". Consider nearby cities or broadening your search. Category has " + categoryCount
                        + " jobs nationally.");

        return ResponseEntity.ok(result);
    }

    /**
     * Chatbot RAG Context.
     * Returns exact live job counts for chatbot queries like:
     * "How many [Job Title] jobs are in [City] right now?"
     */
    @PostMapping("/rag-context")
    public ResponseEntity<Map<String, Object>> getRagContext(
            @RequestBody Map<String, String> request) {
        String jobTitle = request.getOrDefault("jobTitle", "");
        String city = request.getOrDefault("city", "");

        String category = riskAnalysisService.normalizeToCategory(jobTitle);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("query", Map.of("jobTitle", jobTitle, "city", city));
        result.put("normalizedCategory", category);

        if (!city.isEmpty()) {
            long countByCat = jobRepository.countJobsByCategoryAndCity(category, city);
            long countByTitle = jobRepository.countJobsByTitleAndCity(jobTitle, city);
            result.put("jobsByCategory", countByCat);
            result.put("jobsByExactTitle", countByTitle);
            result.put("answer", "There are " + countByCat + " " + category + " jobs in " + city
                    + " (" + countByTitle + " with exact title match '" + jobTitle + "').");
        } else {
            long totalCat = jobRepository.countJobsByCategory(category);
            result.put("totalJobsInCategory", totalCat);
            result.put("answer", "There are " + totalCat + " " + category + " jobs across all cities in the database.");
        }

        // Add AI vulnerability context
        double avi = marketIntelligenceService.getAVIForCategory(category);
        result.put("aiVulnerabilityIndex", Math.round(avi * 10.0) / 10.0);

        return ResponseEntity.ok(result);
    }
}
