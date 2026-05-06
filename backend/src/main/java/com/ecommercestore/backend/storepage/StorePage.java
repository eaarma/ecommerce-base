package com.ecommercestore.backend.storepage;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "store_pages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorePage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "slug", nullable = false, unique = true, length = 80)
    private String slug;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "content_json", columnDefinition = "TEXT", nullable = false)
    private String contentJson;

    @Column(name = "closing_note", length = 4000)
    private String closingNote;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private StorePageStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
        applyDefaults();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
        applyDefaults();
    }

    private void applyDefaults() {
        if (contentJson == null) {
            contentJson = "{}";
        }

        if (status == null) {
            status = StorePageStatus.DRAFT;
        }
    }
}
