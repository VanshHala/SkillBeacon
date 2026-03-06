package com.skillbeacon.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerAnalysisRequest {
    private String jobTitle;
    private String city;
    private Integer yearsOfExperience;
    private List<String> currentSkills;
    private String workDescription;
}
