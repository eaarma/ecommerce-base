package com.ecommercestore.backend.shop;

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
@Table(name = "shops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "store_name", nullable = false, length = 150)
    private String storeName;

    @Column(name = "tagline", length = 255)
    private String tagline;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(name = "long_description", length = 5000)
    private String longDescription;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "favicon_url", length = 500)
    private String faviconUrl;

    @Column(name = "contact_email", length = 320)
    private String contactEmail;

    @Column(name = "support_email", length = 320)
    private String supportEmail;

    @Column(name = "contact_receiver_email", length = 320)
    private String contactReceiverEmail;

    @Column(name = "phone_number", length = 50)
    private String phoneNumber;

    @Column(name = "address_line1", length = 255)
    private String addressLine1;

    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    @Column(name = "city", length = 150)
    private String city;

    @Column(name = "postal_code", length = 40)
    private String postalCode;

    @Column(name = "country", length = 120)
    private String country;

    @Column(name = "business_hours", length = 1000)
    private String businessHours;

    @Column(name = "show_address", nullable = false)
    private Boolean showAddress;

    @Column(name = "show_phone", nullable = false)
    private Boolean showPhone;

    @Column(name = "show_support_email", nullable = false)
    private Boolean showSupportEmail;

    @Column(name = "instagram_url", length = 500)
    private String instagramUrl;

    @Column(name = "facebook_url", length = 500)
    private String facebookUrl;

    @Column(name = "tiktok_url", length = 500)
    private String tiktokUrl;

    @Column(name = "x_url", length = 500)
    private String xUrl;

    @Column(name = "primary_color", nullable = false, length = 20)
    private String primaryColor;

    @Column(name = "accent_color", nullable = false, length = 20)
    private String accentColor;

    @Enumerated(EnumType.STRING)
    @Column(name = "theme_mode", nullable = false, length = 30)
    private ShopThemeMode themeMode;

    @Column(name = "seo_title", length = 255)
    private String seoTitle;

    @Column(name = "seo_description", length = 500)
    private String seoDescription;

    @Column(name = "seo_keywords", length = 1000)
    private String seoKeywords;

    @Column(name = "og_image_url", length = 500)
    private String ogImageUrl;

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

        if (themeMode == null) {
            themeMode = ShopThemeMode.LIGHT;
        }

        if (showAddress == null) {
            showAddress = true;
        }

        if (showPhone == null) {
            showPhone = true;
        }

        if (showSupportEmail == null) {
            showSupportEmail = true;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();

        if (themeMode == null) {
            themeMode = ShopThemeMode.LIGHT;
        }

        if (showAddress == null) {
            showAddress = true;
        }

        if (showPhone == null) {
            showPhone = true;
        }

        if (showSupportEmail == null) {
            showSupportEmail = true;
        }
    }
}
