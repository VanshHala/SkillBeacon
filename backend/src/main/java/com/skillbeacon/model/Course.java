package com.skillbeacon.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "courses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_name", nullable = false)
    private String courseName;

    @Column(nullable = false)
    private String platform;

    private String institution;

    @Column(name = "duration_weeks")
    private Integer durationWeeks;

    private String category;

    private String level;

    @Column(name = "skills_covered", columnDefinition = "jsonb")
    private String skillsCovered;

    @Column(name = "course_url")
    private String courseUrl;
}
