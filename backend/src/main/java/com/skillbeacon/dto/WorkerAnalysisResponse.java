package com.skillbeacon.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerAnalysisResponse {
    private Double riskScore;
    private String riskLevel;
    private List<String> saferRoles;
    private List<String> recommendedSkills;
    private List<String> missingSkills;
    private List<String> extractedSkills;
    private String careerRoadmapStr;
    private List<Map<String, Object>> reskillingRoadmap;
    private List<Map<String, Object>> recommendedCourses;
    private Map<String, Double> riskFactors;
}
