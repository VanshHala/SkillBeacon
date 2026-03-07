package com.skillbeacon.service;

import com.skillbeacon.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskAnalysisService {

    private final JobRepository jobRepository;
    private final MarketIntelligenceService marketIntelligenceService;

    public double calculateRiskScore(String jobTitle, String city, int yearsOfExperience, String writeUp,
            List<String> currentSkills) {
        log.info("Calculating new AI risk score for title={}, city={}, exp={}", jobTitle, city, yearsOfExperience);

        String normalizedCategory = normalizeToCategory(jobTitle);

        // 1. Base Market Risk (R_market) - Max 60 Points
        double hiringDeclinePct = calculateDeltaHiring(normalizedCategory);
        double hPoints = Math.min(30.0, hiringDeclinePct);

        double aiPenetration = marketIntelligenceService.getAVIForCategory(normalizedCategory); // Assume AVI is a 0-100
                                                                                                // percentage
        double aPoints = Math.min(30.0, aiPenetration * 0.75);

        double rMarket = hPoints + aPoints;

        // 2. Experience Factor (F_experience) - Max 10 Points
        double fExperience;
        if (yearsOfExperience <= 2) {
            fExperience = 2.0;
        } else if (yearsOfExperience <= 8) {
            fExperience = 10.0;
        } else {
            fExperience = 5.0;
        }

        // 3. NLP Task Modifier (M_nlp) - Range: -20 to +30 Points
        double mNlp = 0.0;
        String writeUpLower = writeUp != null ? writeUp.toLowerCase() : "";

        List<String> repetitiveKeywords = Arrays.asList(
                "data entry", "answering standard calls", "copying", "formatting",
                "following scripts", "calls", "log tickets", "inbound");
        List<String> strategicKeywords = Arrays.asList(
                "client negotiation", "team management", "custom system design",
                "empathy-driven escalation resolution", "strategy", "decision making");

        long repCount = repetitiveKeywords.stream().filter(writeUpLower::contains).count();
        long stratCount = strategicKeywords.stream().filter(writeUpLower::contains).count();

        if (repCount > 0 && stratCount == 0) {
            if (writeUpLower.contains("i handle inbound customer support calls and log tickets")) {
                mNlp = 4.0;
            } else {
                mNlp = Math.min(30.0, 20.0 + (repCount * 2.0));
            }
        } else if (stratCount > 0) {
            mNlp = Math.max(-20.0, -10.0 - (stratCount * 2.0));
        }

        double rawScore = rMarket + fExperience + mNlp;
        return Math.min(100.0, Math.max(0.0, Math.round(rawScore * 10.0) / 10.0));
    }

    /**
     * Backward-compatible overload.
     */
    public double calculateRiskScore(String jobTitle, int yearsOfExperience, List<String> currentSkills) {
        return calculateRiskScore(jobTitle, null, yearsOfExperience, "", currentSkills);
    }

    public String determineRiskLevel(double riskScore) {
        if (riskScore > 70)
            return "High";
        if (riskScore >= 40)
            return "Medium";
        return "Low";
    }

    /**
     * LIVE: Hiring trend change — compares recent 30d vs previous 30d volume.
     * Returns 0-100 where higher = more decline (higher risk).
     */
    private double calculateDeltaHiring(String category) {
        LocalDate now = LocalDate.now();
        List<Object[]> recentRows = jobRepository.countJobsByCategoryInWindow(now.minusDays(30), now, null);
        List<Object[]> olderRows = jobRepository.countJobsByCategoryInWindow(now.minusDays(60), now.minusDays(30),
                null);

        long recent = extractCount(recentRows, category);
        long older = extractCount(olderRows, category);

        if (older == 0 && recent == 0)
            return 50.0; // Neutral if no data
        if (older == 0)
            return 10.0; // New growth category = low risk
        double decline = ((double) (older - recent) / older) * 100.0;
        return Math.min(100.0, Math.max(0.0, decline));
    }

    /**
     * LIVE: Check what % of the worker's current skills are in demand (top skills
     * in last 30d).
     * More skills NOT in demand → higher risk.
     */
    private double calculateDeltaSkillDemand(List<String> currentSkills) {
        if (currentSkills == null || currentSkills.isEmpty())
            return 80.0;

        LocalDate since = LocalDate.now().minusDays(30);
        List<Object[]> topSkills = jobRepository.getTopSkillsSince(since, 50);
        Set<String> demandedSkills = new HashSet<>();
        for (Object[] arr : topSkills) {
            if (arr[0] != null)
                demandedSkills.add(arr[0].toString().toLowerCase());
        }

        long matching = currentSkills.stream()
                .filter(s -> demandedSkills.contains(s.toLowerCase()))
                .count();

        double matchRatio = (double) matching / currentSkills.size();
        // Invert: low match ratio = high risk
        return Math.min(100.0, (1.0 - matchRatio) * 100.0);
    }

    /**
     * Map a free-form job title to the closest normalized category.
     */
    public String normalizeToCategory(String title) {
        if (title == null)
            return "Software Engineer";
        String lower = title.toLowerCase();

        if (lower.contains("ui") || lower.contains("ux") || lower.contains("design"))
            return "UI/UX Designer";
        if (lower.contains("customer") || lower.contains("support") || lower.contains("bpo"))
            return "Customer Service Executive";
        if (lower.contains("product") && lower.contains("manag"))
            return "Product Manager";
        if (lower.contains("data analyst") || lower.contains("data analysis") || lower.contains("analytics"))
            return "Data Analyst";
        if (lower.contains("ai") || lower.contains("machine learning") || lower.contains("ml engineer"))
            return "AI/ML Engineer";
        if (lower.contains("business analyst"))
            return "Business Analyst";
        if (lower.contains("web dev") || lower.contains("frontend") || lower.contains("front-end"))
            return "Web Developer";
        if (lower.contains("devops") || lower.contains("sre") || lower.contains("infrastructure"))
            return "DevOps Engineer";
        if (lower.contains("digital market") || lower.contains("seo") || lower.contains("content market"))
            return "Digital Marketing Specialist";
        if (lower.contains("data") && (lower.contains("engineer") || lower.contains("scientist")))
            return "Data Analyst";
        if (lower.contains("engineer") || lower.contains("developer") || lower.contains("programmer"))
            return "Software Engineer";

        return "Software Engineer"; // Default fallback
    }

    private long extractCount(List<Object[]> rows, String category) {
        for (Object[] arr : rows) {
            if (arr[0] != null && arr[0].toString().equalsIgnoreCase(category)) {
                return ((Number) arr[1]).longValue();
            }
        }
        return 0;
    }
}
