package com.skillbeacon.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "analytics_snapshots")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AnalyticsSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "snapshot_type", nullable = false)
    private String snapshotType;

    @Column(name = "data", columnDefinition = "jsonb", nullable = false)
    private String data;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
