package com.skillbeacon.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbeacon.ai.GeminiClient;
import com.skillbeacon.dto.WorkerAnalysisRequest;
import com.skillbeacon.dto.WorkerAnalysisResponse;
import com.skillbeacon.model.RiskScore;
import com.skillbeacon.model.User;
import com.skillbeacon.model.WorkerProfile;
import com.skillbeacon.repository.RiskScoreRepository;
import com.skillbeacon.repository.UserRepository;
import com.skillbeacon.repository.WorkerProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkerAnalysisService {

    private final GeminiClient geminiClient;
    private final RiskAnalysisService riskAnalysisService;
    private final SkillExtractionService skillExtractionService;
    private final WorkerProfileRepository workerProfileRepository;
    private final RiskScoreRepository riskScoreRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public WorkerAnalysisResponse analyzeWorkerProfile(String clerkUserId, WorkerAnalysisRequest request) {
        log.info("Analyzing profile for user {} with job title {}", clerkUserId, request.getJobTitle());

        User user = userRepository.findByClerkUserId(clerkUserId)
                .orElseGet(() -> userRepository.save(User.builder()
                        .clerkUserId(clerkUserId)
                        .email("unknown@skillbeacon.com") // Clerk webhook should handle user sync, this is fallback
                        .build()));

        // 1. Extract implicit skills
        List<String> extractedSkills = new ArrayList<>();
        if (request.getWorkDescription() != null && !request.getWorkDescription().isEmpty()) {
            extractedSkills = skillExtractionService.extractSkillsFromDescription(request.getWorkDescription());
        }

        List<String> combinedSkills = new ArrayList<>(request.getCurrentSkills());
        for (String es : extractedSkills) {
            if (!combinedSkills.contains(es))
                combinedSkills.add(es);
        }

        // 2. Risk Calculation
        double riskScoreValue = riskAnalysisService.calculateRiskScore(request.getJobTitle(),
                request.getYearsOfExperience(), combinedSkills);
        String riskLevel = riskAnalysisService.determineRiskLevel(riskScoreValue);

        // 3. Ask Gemini for Roadmap and Recommendations using a JSON schema prompt
        String prompt = "Generate a JSON response for a worker transitioning to a lower-risk tech career. " +
                "They are a " + request.getJobTitle() + " with " + request.getYearsOfExperience()
                + " years experience. " +
                "Current skills: " + String.join(", ", combinedSkills) + ". " +
                "Target JSON format (no markdown blocks, pure JSON):\n" +
                "{\n" +
                "  \"saferRoles\": [\"Role 1\", \"Role 2\"],\n" +
                "  \"recommendedSkills\": [\"Skill A\", \"Skill B\"],\n" +
                "  \"missingSkills\": [\"Skill C\"],\n" +
                "  \"reskillingRoadmap\": [ { \"week\": \"1-2\", \"focus\": \"...\", \"description\": \"...\" } ],\n" +
                "  \"recommendedCourses\": [ { \"title\": \"...\", \"platform\": \"NPTEL\", \"url\": \"#\" } ]\n" +
                "}";

        String systemPrompt = "You are a professional career counselor AI. Always respond in valid JSON.";
        String geminiJsonObj = geminiClient.generateContent(systemPrompt, prompt);

        WorkerAnalysisResponse response = new WorkerAnalysisResponse();
        response.setRiskScore(riskScoreValue);
        response.setRiskLevel(riskLevel);
        response.setRiskFactors(Map.of(
                "Automation", riskScoreValue > 50 ? 0.8 : 0.3,
                "HiringDrop", riskScoreValue > 40 ? 0.6 : 0.2,
                "SkillDemand", riskScoreValue > 30 ? 0.5 : 0.1));

        String saferRolesJson = "[]";
        String recommendedSkillsJson = "[]";
        String roadmapJson = "[]";

        try {
            String cleanJson = geminiJsonObj.replaceAll("```json", "").replaceAll("```", "").trim();
            JsonNode root = objectMapper.readTree(cleanJson);

            response.setSaferRoles(objectMapper.convertValue(root.get("saferRoles"), List.class));
            response.setRecommendedSkills(objectMapper.convertValue(root.get("recommendedSkills"), List.class));
            response.setMissingSkills(objectMapper.convertValue(root.get("missingSkills"), List.class));
            response.setReskillingRoadmap(objectMapper.convertValue(root.get("reskillingRoadmap"), List.class));
            response.setRecommendedCourses(objectMapper.convertValue(root.get("recommendedCourses"), List.class));

            saferRolesJson = objectMapper.writeValueAsString(response.getSaferRoles());
            recommendedSkillsJson = objectMapper.writeValueAsString(response.getRecommendedSkills());
            roadmapJson = objectMapper.writeValueAsString(response.getReskillingRoadmap());

        } catch (Exception e) {
            log.error("Failed to parse Gemini complex JSON: {}", geminiJsonObj, e);
            response.setSaferRoles(List.of("Data Analyst", "Cloud Support Engineer"));
            response.setRecommendedSkills(List.of("Python", "AWS"));
            response.setMissingSkills(List.of("Cloud Architecture"));
            response.setReskillingRoadmap(
                    List.of(Map.of("week", "1", "focus", "Foundations", "description", "Learn basics")));
            response.setRecommendedCourses(List.of());
        }

        // 4. Save to Database
        try {
            WorkerProfile profile = WorkerProfile.builder()
                    .user(user)
                    .jobTitle(request.getJobTitle())
                    .city(request.getCity())
                    .yearsOfExperience(request.getYearsOfExperience())
                    .currentSkills(objectMapper.writeValueAsString(request.getCurrentSkills()))
                    .workDescription(request.getWorkDescription())
                    .extractedSkills(objectMapper.writeValueAsString(extractedSkills))
                    .build();
            workerProfileRepository.save(profile);

            RiskScore riskDb = RiskScore.builder()
                    .profile(profile)
                    .score(riskScoreValue)
                    .riskLevel(riskLevel)
                    .hiringDeclineFactor(0.5) // Mock
                    .automationVulnerability(0.4) // Mock
                    .skillDemandDrop(0.3) // Mock
                    .experienceFactor(0.2) // Mock
                    .saferRoles(saferRolesJson)
                    .recommendedSkills(recommendedSkillsJson)
                    .reskillingRoadmap(roadmapJson)
                    .build();
            riskScoreRepository.save(riskDb);
        } catch (Exception e) {
            log.error("Failed to save JSON fields to DB", e);
        }

        return response;
    }
}
