package com.skillbeacon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskAnalysisService {

    // Risk Score Formula: RiskScore = (0.4 * ∆H) + (0.3 * AI_v) + (0.2 * ∆S) + (0.1
    // * Exp)
    public double calculateRiskScore(String jobTitle, int yearsOfExperience, List<String> currentSkills) {
        log.info("Calculating risk score for job title: {}", jobTitle);

        // Mock parameters to represent trends ∆H, AI_v, ∆S.
        // In a fully populated system, these would be aggregated from AnalyticsSnapshot
        // or Job aggregations.
        double deltaHiring = calculateDeltaHiringMock(jobTitle);
        double aiVulnerability = calculateAIVulnerabilityMock(jobTitle);
        double deltaSkillDemand = calculateDeltaSkillDemandMock(currentSkills);
        // Experience factor: inverse relationship. Higher exp means slightly lower risk
        // factor. Max cap at 10 to normalize.
        double experienceFactor = Math.max(0.0, 10.0 - yearsOfExperience) / 10.0 * 100.0;

        double riskScore = (0.4 * deltaHiring) + (0.3 * aiVulnerability) + (0.2 * deltaSkillDemand)
                + (0.1 * experienceFactor);

        // Ensure bounds 0 - 100
        return Math.min(100.0, Math.max(0.0, riskScore));
    }

    public String determineRiskLevel(double riskScore) {
        if (riskScore > 70)
            return "High";
        if (riskScore >= 40)
            return "Medium";
        return "Low";
    }

    private double calculateDeltaHiringMock(String jobTitle) {
        if (jobTitle.toLowerCase().contains("ai") || jobTitle.toLowerCase().contains("data"))
            return 20.0;
        if (jobTitle.toLowerCase().contains("manager"))
            return 50.0;
        return 65.0; // Default generic risk factor
    }

    private double calculateAIVulnerabilityMock(String jobTitle) {
        if (jobTitle.toLowerCase().contains("writer") || jobTitle.toLowerCase().contains("support"))
            return 85.0;
        if (jobTitle.toLowerCase().contains("engineer"))
            return 30.0;
        return 50.0;
    }

    private double calculateDeltaSkillDemandMock(List<String> skills) {
        // Mock calculation based on skill size. Fewer skills = higher risk.
        if (skills == null || skills.isEmpty())
            return 90.0;
        if (skills.size() > 5)
            return 30.0;
        return 60.0;
    }
}
