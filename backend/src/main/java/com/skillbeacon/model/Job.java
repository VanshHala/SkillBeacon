package com.skillbeacon.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_title", nullable = false)
    private String jobTitle;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "location_city")
    private String locationCity;

    @Column(name = "skills_required", columnDefinition = "jsonb")
    private String skillsRequired;

    @Column(name = "experience_required")
    private String experienceRequired;

    @Column(name = "salary")
    private String salary;

    @Column(name = "job_posted_date")
    private LocalDate jobPostedDate;

    @Column(name = "job_description", columnDefinition = "TEXT")
    private String jobDescription;

    @Column(name = "source_platform")
    private String sourcePlatform;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
