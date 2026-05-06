package com.ecommercestore.backend.shop;

import java.net.URI;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.ecommercestore.backend.shop.dto.ShopPublicResponse;
import com.ecommercestore.backend.shop.dto.ShopResponse;
import com.ecommercestore.backend.shop.dto.UpdateShopRequest;

@Component
public class ShopMapper {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern HEX_COLOR_PATTERN = Pattern.compile(
            "^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$");

    public ShopPublicResponse toPublicResponse(Shop shop) {
        return ShopPublicResponse.builder()
                .storeName(shop.getStoreName())
                .tagline(shop.getTagline())
                .shortDescription(shop.getShortDescription())
                .longDescription(shop.getLongDescription())
                .logoUrl(shop.getLogoUrl())
                .faviconUrl(shop.getFaviconUrl())
                .contactEmail(shop.getContactEmail())
                .supportEmail(shop.getSupportEmail())
                .phoneNumber(shop.getPhoneNumber())
                .addressLine1(shop.getAddressLine1())
                .addressLine2(shop.getAddressLine2())
                .city(shop.getCity())
                .postalCode(shop.getPostalCode())
                .country(shop.getCountry())
                .businessHours(shop.getBusinessHours())
                .showAddress(Boolean.TRUE.equals(shop.getShowAddress()))
                .showPhone(Boolean.TRUE.equals(shop.getShowPhone()))
                .showSupportEmail(Boolean.TRUE.equals(shop.getShowSupportEmail()))
                .instagramUrl(shop.getInstagramUrl())
                .facebookUrl(shop.getFacebookUrl())
                .tiktokUrl(shop.getTiktokUrl())
                .xUrl(shop.getXUrl())
                .primaryColor(shop.getPrimaryColor())
                .accentColor(shop.getAccentColor())
                .themeMode(shop.getThemeMode())
                .seoTitle(shop.getSeoTitle())
                .seoDescription(shop.getSeoDescription())
                .seoKeywords(shop.getSeoKeywords())
                .ogImageUrl(shop.getOgImageUrl())
                .build();
    }

    public ShopResponse toResponse(Shop shop) {
        return ShopResponse.builder()
                .id(shop.getId())
                .storeName(shop.getStoreName())
                .tagline(shop.getTagline())
                .shortDescription(shop.getShortDescription())
                .longDescription(shop.getLongDescription())
                .logoUrl(shop.getLogoUrl())
                .faviconUrl(shop.getFaviconUrl())
                .contactEmail(shop.getContactEmail())
                .supportEmail(shop.getSupportEmail())
                .contactReceiverEmail(shop.getContactReceiverEmail())
                .phoneNumber(shop.getPhoneNumber())
                .addressLine1(shop.getAddressLine1())
                .addressLine2(shop.getAddressLine2())
                .city(shop.getCity())
                .postalCode(shop.getPostalCode())
                .country(shop.getCountry())
                .businessHours(shop.getBusinessHours())
                .showAddress(Boolean.TRUE.equals(shop.getShowAddress()))
                .showPhone(Boolean.TRUE.equals(shop.getShowPhone()))
                .showSupportEmail(Boolean.TRUE.equals(shop.getShowSupportEmail()))
                .instagramUrl(shop.getInstagramUrl())
                .facebookUrl(shop.getFacebookUrl())
                .tiktokUrl(shop.getTiktokUrl())
                .xUrl(shop.getXUrl())
                .primaryColor(shop.getPrimaryColor())
                .accentColor(shop.getAccentColor())
                .themeMode(shop.getThemeMode())
                .seoTitle(shop.getSeoTitle())
                .seoDescription(shop.getSeoDescription())
                .seoKeywords(shop.getSeoKeywords())
                .ogImageUrl(shop.getOgImageUrl())
                .createdAt(shop.getCreatedAt())
                .updatedAt(shop.getUpdatedAt())
                .build();
    }

    public void updateEntity(UpdateShopRequest request, Shop shop) {
        shop.setStoreName(normalizeRequired(request.getStoreName(), "Store name"));
        shop.setTagline(normalizeOptional(request.getTagline()));
        shop.setShortDescription(normalizeOptional(request.getShortDescription()));
        shop.setLongDescription(normalizeOptional(request.getLongDescription()));
        shop.setLogoUrl(normalizeUrl(request.getLogoUrl(), "Logo URL"));
        shop.setFaviconUrl(normalizeUrl(request.getFaviconUrl(), "Favicon URL"));
        shop.setContactEmail(normalizeEmail(request.getContactEmail(), "Contact email"));
        shop.setSupportEmail(normalizeEmail(request.getSupportEmail(), "Support email"));
        shop.setContactReceiverEmail(normalizeEmail(request.getContactReceiverEmail(), "Contact receiver email"));
        shop.setPhoneNumber(normalizeOptional(request.getPhoneNumber()));
        shop.setAddressLine1(normalizeOptional(request.getAddressLine1()));
        shop.setAddressLine2(normalizeOptional(request.getAddressLine2()));
        shop.setCity(normalizeOptional(request.getCity()));
        shop.setPostalCode(normalizeOptional(request.getPostalCode()));
        shop.setCountry(normalizeOptional(request.getCountry()));
        shop.setBusinessHours(normalizeOptional(request.getBusinessHours()));
        shop.setShowAddress(request.getShowAddress() != null ? request.getShowAddress() : Boolean.TRUE);
        shop.setShowPhone(request.getShowPhone() != null ? request.getShowPhone() : Boolean.TRUE);
        shop.setShowSupportEmail(request.getShowSupportEmail() != null ? request.getShowSupportEmail() : Boolean.TRUE);
        shop.setInstagramUrl(normalizeUrl(request.getInstagramUrl(), "Instagram URL"));
        shop.setFacebookUrl(normalizeUrl(request.getFacebookUrl(), "Facebook URL"));
        shop.setTiktokUrl(normalizeUrl(request.getTiktokUrl(), "TikTok URL"));
        shop.setXUrl(normalizeUrl(request.getXUrl(), "X URL"));
        shop.setPrimaryColor(normalizeColor(request.getPrimaryColor(), "Primary color"));
        shop.setAccentColor(normalizeColor(request.getAccentColor(), "Accent color"));
        shop.setThemeMode(request.getThemeMode() != null ? request.getThemeMode() : ShopThemeMode.LIGHT);
        shop.setSeoTitle(normalizeOptional(request.getSeoTitle()));
        shop.setSeoDescription(normalizeOptional(request.getSeoDescription()));
        shop.setSeoKeywords(normalizeOptional(request.getSeoKeywords()));
        shop.setOgImageUrl(normalizeUrl(request.getOgImageUrl(), "Open Graph image URL"));
    }

    private String normalizeRequired(String value, String fieldLabel) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new IllegalArgumentException(fieldLabel + " is required.");
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        return value.trim();
    }

    private String normalizeEmail(String value, String fieldLabel) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            return null;
        }

        String normalizedEmail = normalized.toLowerCase(Locale.ROOT);
        if (!EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
            throw new IllegalArgumentException(fieldLabel + " must be a valid email address.");
        }

        return normalizedEmail;
    }

    private String normalizeColor(String value, String fieldLabel) {
        String normalized = normalizeRequired(value, fieldLabel).toLowerCase(Locale.ROOT);
        if (!HEX_COLOR_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException(fieldLabel + " must be a valid hex color.");
        }

        return normalized;
    }

    private String normalizeUrl(String value, String fieldLabel) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            return null;
        }

        try {
            URI uri = URI.create(normalized);
            String scheme = uri.getScheme();

            if (scheme == null
                    || (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))) {
                throw new IllegalArgumentException(fieldLabel + " must use http or https.");
            }
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(fieldLabel + " must be a valid absolute URL.");
        }

        return normalized;
    }
}
