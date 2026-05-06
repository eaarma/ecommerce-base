package com.ecommercestore.backend.homepage;

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
@Table(name = "homepage_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomepageConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hero_enabled", nullable = false)
    private Boolean heroEnabled;

    @Column(name = "hero_title", length = 255)
    private String heroTitle;

    @Column(name = "hero_subtitle", length = 1000)
    private String heroSubtitle;

    @Column(name = "hero_button_text", length = 120)
    private String heroButtonText;

    @Column(name = "hero_button_link", length = 500)
    private String heroButtonLink;

    @Enumerated(EnumType.STRING)
    @Column(name = "hero_button_position", nullable = false, length = 30)
    private HomepageHeroButtonPosition heroButtonPosition;

    @Column(name = "hero_image_url", length = 500)
    private String heroImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "hero_text_color_mode", nullable = false, length = 30)
    private HomepageHeroTextColorMode heroTextColorMode;

    @Column(name = "hero_custom_text_color", length = 20)
    private String heroCustomTextColor;

    @Column(name = "hero_overlay_strength", nullable = false)
    private Integer heroOverlayStrength;

    @Column(name = "featured_enabled", nullable = false)
    private Boolean featuredEnabled;

    @Column(name = "featured_title", length = 255)
    private String featuredTitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "featured_selection_mode", nullable = false, length = 30)
    private HomepageFeaturedSelectionMode featuredSelectionMode;

    @Column(name = "featured_product_ids", columnDefinition = "TEXT", nullable = false)
    private String featuredProductIdsJson;

    @Column(name = "featured_max_items", nullable = false)
    private Integer featuredMaxItems;

    @Column(name = "spotlight_enabled", nullable = false)
    private Boolean spotlightEnabled;

    @Column(name = "spotlight_product_id")
    private Long spotlightProductId;

    @Column(name = "spotlight_badge_title", length = 120)
    private String spotlightBadgeTitle;

    @Column(name = "collection_enabled", nullable = false)
    private Boolean collectionEnabled;

    @Column(name = "collection_blocks_json", columnDefinition = "TEXT", nullable = false)
    private String collectionBlocksJson;

    @Column(name = "value_section_enabled", nullable = false)
    private Boolean valueSectionEnabled;

    @Column(name = "value_cards_json", columnDefinition = "TEXT", nullable = false)
    private String valueCardsJson;

    @Column(name = "cta_enabled", nullable = false)
    private Boolean ctaEnabled;

    @Column(name = "cta_title", length = 255)
    private String ctaTitle;

    @Column(name = "cta_description", length = 1000)
    private String ctaDescription;

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
        if (heroEnabled == null) {
            heroEnabled = Boolean.TRUE;
        }

        if (heroButtonPosition == null) {
            heroButtonPosition = HomepageHeroButtonPosition.LEFT;
        }

        if (heroTextColorMode == null) {
            heroTextColorMode = HomepageHeroTextColorMode.AUTO;
        }

        if (heroOverlayStrength == null || heroOverlayStrength < 0 || heroOverlayStrength > 100) {
            heroOverlayStrength = 36;
        }

        if (featuredEnabled == null) {
            featuredEnabled = Boolean.TRUE;
        }

        if (featuredSelectionMode == null) {
            featuredSelectionMode = HomepageFeaturedSelectionMode.LATEST;
        }

        if (featuredProductIdsJson == null) {
            featuredProductIdsJson = "[]";
        }

        if (featuredMaxItems == null || featuredMaxItems < 1) {
            featuredMaxItems = 6;
        }

        if (spotlightEnabled == null) {
            spotlightEnabled = Boolean.TRUE;
        }

        if (collectionEnabled == null) {
            collectionEnabled = Boolean.TRUE;
        }

        if (collectionBlocksJson == null) {
            collectionBlocksJson = "[]";
        }

        if (valueSectionEnabled == null) {
            valueSectionEnabled = Boolean.TRUE;
        }

        if (valueCardsJson == null) {
            valueCardsJson = "[]";
        }

        if (ctaEnabled == null) {
            ctaEnabled = Boolean.TRUE;
        }
    }
}
