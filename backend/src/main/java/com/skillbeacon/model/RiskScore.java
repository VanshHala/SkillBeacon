package com.skillbeacon.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "risk_scores")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RiskScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private WorkerProfile profile;

    @Column(nullable = false)
    private Double score;

    @Column(name = "risk_level", nullable = false)
    private String riskLevel;

    @Column(name = "hiring_decline_factor")
    private Double hiringDeclineFactor;

    @Column(name = "automation_vulnerability")
    private Double automationVulnerability;

    @Column(name = "skill_demand_drop")
    private Double skillDemandDrop;

    @Column(name = "experience_factor")
    private Double experienceFactor;

    @Column(name = "safer_roles", columnDefinition = "jsonb")
    private String saferRoles;

    @Column(name = "recommended_skills", columnDefinition = "jsonb")
    private String recommendedSkills;

    @Column(name = "reskilling_roadmap", columnDefinition = "jsonb")
    private String reskillingRoadmap;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
