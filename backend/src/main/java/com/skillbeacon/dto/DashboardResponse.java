package com.skillbeacon.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {
    private long totalJobs;
    private String avgSalary;
    private double marketVolatility;
    private double aiConfidence;
    private List<Map<String, Object>> jobsByCity;
    private List<Map<String, Object>> jobsByRole;
    private List<Map<String, Object>> topSkills;
    private List<Map<String, Object>> trendData;
    private List<Map<String, Object>> aiInsights;
    private List<Map<String, Object>> competitors;
}
