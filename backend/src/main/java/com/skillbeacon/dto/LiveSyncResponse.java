package com.skillbeacon.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LiveSyncResponse {
    // Sync metadata
    private int newJobsAdded;
    private String syncTimestamp;
    private String scrapedRole;
    private String scrapedCity;

    // Layer 1 — Market Intelligence (recalculated on entire dataset)
    private List<Map<String, Object>> aiVulnerabilityIndex;
    private Map<String, Object> skillsIntelligence;
    private Map<String, Object> hiringTrends;

    // Layer 2 — Worker Personal Risk (recalculated)
    private Double personalRiskScore;
    private String personalRiskLevel;
    private Double marketAVI; // AVI for worker's specific role
    private String targetRolePivot; // recommended safe role if risk > 60
    private Long targetRoleJobCount; // jobs for target role in city
    private Map<String, Object> ragContext; // updated chatbot context

    // Status
    private String status; // "SUCCESS" or "ERROR"
    private String message;
}
