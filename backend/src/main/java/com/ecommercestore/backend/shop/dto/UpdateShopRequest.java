package com.ecommercestore.backend.shop.dto;

import com.ecommercestore.backend.shop.ShopThemeMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateShopRequest {

    @NotBlank
    @Size(max = 150)
    private String storeName;

    @Size(max = 255)
    private String tagline;

    @Size(max = 500)
    private String shortDescription;

    @Size(max = 5000)
    private String longDescription;

    @Size(max = 500)
    private String logoUrl;

    @Size(max = 500)
    private String faviconUrl;

    @Size(max = 320)
    private String contactEmail;

    @Size(max = 320)
    private String supportEmail;

    @Size(max = 320)
    private String contactReceiverEmail;

    @Size(max = 50)
    private String phoneNumber;

    @Size(max = 255)
    private String addressLine1;

    @Size(max = 255)
    private String addressLine2;

    @Size(max = 150)
    private String city;

    @Size(max = 40)
    private String postalCode;

    @Size(max = 120)
    private String country;

    @Size(max = 1000)
    private String businessHours;

    @NotNull
    private Boolean showAddress;

    @NotNull
    private Boolean showPhone;

    @NotNull
    private Boolean showSupportEmail;

    @Size(max = 500)
    private String instagramUrl;

    @Size(max = 500)
    private String facebookUrl;

    @Size(max = 500)
    private String tiktokUrl;

    @Size(max = 500)
    private String xUrl;

    @NotBlank
    @Size(max = 20)
    private String primaryColor;

    @NotBlank
    @Size(max = 20)
    private String accentColor;

    @NotNull
    private ShopThemeMode themeMode;

    @Size(max = 255)
    private String seoTitle;

    @Size(max = 500)
    private String seoDescription;

    @Size(max = 1000)
    private String seoKeywords;

    @Size(max = 500)
    private String ogImageUrl;
}
