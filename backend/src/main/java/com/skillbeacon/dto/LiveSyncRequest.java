package com.skillbeacon.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LiveSyncRequest {
    private String jobRole;
    private String city;
    // Worker context for Layer 2 recalculation
    private String workerJobTitle;
    private Integer yearsOfExperience;
    private List<String> currentSkills;
    private String workDescription;
}
