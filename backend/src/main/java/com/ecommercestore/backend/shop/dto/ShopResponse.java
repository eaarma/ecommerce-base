package com.ecommercestore.backend.shop.dto;

import java.time.Instant;

import com.ecommercestore.backend.shop.ShopThemeMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopResponse {

    private Long id;
    private String storeName;
    private String tagline;
    private String shortDescription;
    private String longDescription;
    private String logoUrl;
    private String faviconUrl;
    private String contactEmail;
    private String supportEmail;
    private String contactReceiverEmail;
    private String phoneNumber;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String postalCode;
    private String country;
    private String businessHours;
    private boolean showAddress;
    private boolean showPhone;
    private boolean showSupportEmail;
    private String instagramUrl;
    private String facebookUrl;
    private String tiktokUrl;
    private String xUrl;
    private String primaryColor;
    private String accentColor;
    private ShopThemeMode themeMode;
    private String seoTitle;
    private String seoDescription;
    private String seoKeywords;
    private String ogImageUrl;
    private Instant createdAt;
    private Instant updatedAt;
}
