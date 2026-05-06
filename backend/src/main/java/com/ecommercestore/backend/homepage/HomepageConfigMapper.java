package com.ecommercestore.backend.homepage;

import java.net.URI;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.ecommercestore.backend.homepage.dto.HomepageCollectionBlockDto;
import com.ecommercestore.backend.homepage.dto.HomepageConfigPublicResponse;
import com.ecommercestore.backend.homepage.dto.HomepageConfigResponse;
import com.ecommercestore.backend.homepage.dto.HomepageValueCardDto;
import com.ecommercestore.backend.homepage.dto.UpdateHomepageConfigRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;

@Component
public class HomepageConfigMapper {
    private static final Pattern HEX_COLOR_PATTERN = Pattern.compile("^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$");

    private static final ParameterizedTypeReference<List<Long>> LONG_LIST_TYPE =
            new ParameterizedTypeReference<>() {
            };
    private static final ParameterizedTypeReference<List<HomepageCollectionBlockDto>> COLLECTION_BLOCK_LIST_TYPE =
            new ParameterizedTypeReference<>() {
            };
    private static final ParameterizedTypeReference<List<HomepageValueCardDto>> VALUE_CARD_LIST_TYPE =
            new ParameterizedTypeReference<>() {
            };
    private static final ObjectMapper OBJECT_MAPPER = JsonMapper.builder()
            .findAndAddModules()
            .build();

    public HomepageConfigPublicResponse toPublicResponse(HomepageConfig config) {
        return HomepageConfigPublicResponse.builder()
                .heroEnabled(config.getHeroEnabled())
                .heroTitle(config.getHeroTitle())
                .heroSubtitle(config.getHeroSubtitle())
                .heroButtonText(config.getHeroButtonText())
                .heroButtonLink(config.getHeroButtonLink())
                .heroButtonPosition(config.getHeroButtonPosition())
                .heroImageUrl(config.getHeroImageUrl())
                .heroTextColorMode(config.getHeroTextColorMode())
                .heroCustomTextColor(config.getHeroCustomTextColor())
                .heroOverlayStrength(config.getHeroOverlayStrength())
                .featuredEnabled(config.getFeaturedEnabled())
                .featuredTitle(config.getFeaturedTitle())
                .featuredSelectionMode(config.getFeaturedSelectionMode())
                .featuredProductIds(readLongList(config.getFeaturedProductIdsJson()))
                .featuredMaxItems(config.getFeaturedMaxItems())
                .spotlightEnabled(config.getSpotlightEnabled())
                .spotlightProductId(config.getSpotlightProductId())
                .spotlightBadgeTitle(config.getSpotlightBadgeTitle())
                .collectionEnabled(config.getCollectionEnabled())
                .collectionBlocks(readCollectionBlocks(config.getCollectionBlocksJson()))
                .valueSectionEnabled(config.getValueSectionEnabled())
                .valueCards(readValueCards(config.getValueCardsJson()))
                .ctaEnabled(config.getCtaEnabled())
                .ctaTitle(config.getCtaTitle())
                .ctaDescription(config.getCtaDescription())
                .build();
    }

    public HomepageConfigResponse toResponse(HomepageConfig config) {
        return HomepageConfigResponse.builder()
                .id(config.getId())
                .heroEnabled(config.getHeroEnabled())
                .heroTitle(config.getHeroTitle())
                .heroSubtitle(config.getHeroSubtitle())
                .heroButtonText(config.getHeroButtonText())
                .heroButtonLink(config.getHeroButtonLink())
                .heroButtonPosition(config.getHeroButtonPosition())
                .heroImageUrl(config.getHeroImageUrl())
                .heroTextColorMode(config.getHeroTextColorMode())
                .heroCustomTextColor(config.getHeroCustomTextColor())
                .heroOverlayStrength(config.getHeroOverlayStrength())
                .featuredEnabled(config.getFeaturedEnabled())
                .featuredTitle(config.getFeaturedTitle())
                .featuredSelectionMode(config.getFeaturedSelectionMode())
                .featuredProductIds(readLongList(config.getFeaturedProductIdsJson()))
                .featuredMaxItems(config.getFeaturedMaxItems())
                .spotlightEnabled(config.getSpotlightEnabled())
                .spotlightProductId(config.getSpotlightProductId())
                .spotlightBadgeTitle(config.getSpotlightBadgeTitle())
                .collectionEnabled(config.getCollectionEnabled())
                .collectionBlocks(readCollectionBlocks(config.getCollectionBlocksJson()))
                .valueSectionEnabled(config.getValueSectionEnabled())
                .valueCards(readValueCards(config.getValueCardsJson()))
                .ctaEnabled(config.getCtaEnabled())
                .ctaTitle(config.getCtaTitle())
                .ctaDescription(config.getCtaDescription())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    public void updateEntity(UpdateHomepageConfigRequest request, HomepageConfig config) {
        config.setHeroEnabled(Boolean.TRUE.equals(request.getHeroEnabled()));
        config.setHeroTitle(normalizeOptional(request.getHeroTitle()));
        config.setHeroSubtitle(normalizeOptional(request.getHeroSubtitle()));
        config.setHeroButtonText(normalizeOptional(request.getHeroButtonText()));
        config.setHeroButtonLink(normalizePageLink(request.getHeroButtonLink(), "Hero button link"));
        config.setHeroButtonPosition(request.getHeroButtonPosition() != null
                ? request.getHeroButtonPosition()
                : HomepageHeroButtonPosition.LEFT);
        config.setHeroImageUrl(normalizeAssetUrl(request.getHeroImageUrl(), "Hero image URL"));
        HomepageHeroTextColorMode heroTextColorMode = request.getHeroTextColorMode() != null
                ? request.getHeroTextColorMode()
                : HomepageHeroTextColorMode.AUTO;
        config.setHeroTextColorMode(heroTextColorMode);
        config.setHeroCustomTextColor(normalizeHeroCustomTextColor(
                request.getHeroCustomTextColor(),
                heroTextColorMode));
        config.setHeroOverlayStrength(normalizeOverlayStrength(request.getHeroOverlayStrength()));
        config.setFeaturedEnabled(Boolean.TRUE.equals(request.getFeaturedEnabled()));
        config.setFeaturedTitle(normalizeOptional(request.getFeaturedTitle()));
        config.setFeaturedSelectionMode(request.getFeaturedSelectionMode() != null
                ? request.getFeaturedSelectionMode()
                : HomepageFeaturedSelectionMode.LATEST);
        config.setFeaturedProductIdsJson(writeJson(normalizeProductIds(request.getFeaturedProductIds())));
        config.setFeaturedMaxItems(request.getFeaturedMaxItems() != null && request.getFeaturedMaxItems() > 0
                ? request.getFeaturedMaxItems()
                : 6);
        config.setSpotlightEnabled(Boolean.TRUE.equals(request.getSpotlightEnabled()));
        config.setSpotlightProductId(normalizeProductId(request.getSpotlightProductId(), "Spotlight product id"));
        config.setSpotlightBadgeTitle(normalizeOptional(request.getSpotlightBadgeTitle()));
        config.setCollectionEnabled(Boolean.TRUE.equals(request.getCollectionEnabled()));
        config.setCollectionBlocksJson(writeJson(normalizeCollectionBlocks(request.getCollectionBlocks())));
        config.setValueSectionEnabled(Boolean.TRUE.equals(request.getValueSectionEnabled()));
        config.setValueCardsJson(writeJson(normalizeValueCards(request.getValueCards())));
        config.setCtaEnabled(Boolean.TRUE.equals(request.getCtaEnabled()));
        config.setCtaTitle(normalizeOptional(request.getCtaTitle()));
        config.setCtaDescription(normalizeOptional(request.getCtaDescription()));
    }

    private List<Long> readLongList(String value) {
        return readJsonList(value, LONG_LIST_TYPE);
    }

    private List<HomepageCollectionBlockDto> readCollectionBlocks(String value) {
        return readJsonList(value, COLLECTION_BLOCK_LIST_TYPE);
    }

    private List<HomepageValueCardDto> readValueCards(String value) {
        return readJsonList(value, VALUE_CARD_LIST_TYPE);
    }

    private <T> List<T> readJsonList(String value, ParameterizedTypeReference<List<T>> type) {
        String payload = StringUtils.hasText(value) ? value.trim() : "[]";

        try {
            return OBJECT_MAPPER.readValue(
                    payload,
                    OBJECT_MAPPER.getTypeFactory().constructType(type.getType()));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored homepage configuration is invalid JSON.", exception);
        }
    }

    private String writeJson(Object value) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize homepage configuration.", exception);
        }
    }

    private List<Long> normalizeProductIds(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return List.of();
        }

        LinkedHashSet<Long> uniqueIds = new LinkedHashSet<>();

        for (Long productId : productIds) {
            if (productId == null) {
                throw new IllegalArgumentException("Featured product ids cannot contain null values.");
            }

            uniqueIds.add(normalizeProductId(productId, "Featured product id"));
        }

        return List.copyOf(uniqueIds);
    }

    private Long normalizeProductId(Long productId, String fieldLabel) {
        if (productId == null) {
            return null;
        }

        if (productId <= 0) {
            throw new IllegalArgumentException(fieldLabel + " must be greater than 0.");
        }

        return productId;
    }

    private List<HomepageCollectionBlockDto> normalizeCollectionBlocks(List<HomepageCollectionBlockDto> blocks) {
        if (blocks == null || blocks.isEmpty()) {
            return List.of();
        }

        return blocks.stream()
                .map(block -> {
                    if (block == null) {
                        throw new IllegalArgumentException("Collection blocks cannot contain null items.");
                    }

                    return block;
                })
                .map(block -> HomepageCollectionBlockDto.builder()
                        .badge(normalizeOptional(block.getBadge()))
                        .title(normalizeOptional(block.getTitle()))
                        .description(normalizeOptional(block.getDescription()))
                        .productId(normalizeProductId(block.getProductId(), "Collection block product id"))
                        .build())
                .toList();
    }

    private List<HomepageValueCardDto> normalizeValueCards(List<HomepageValueCardDto> cards) {
        if (cards == null || cards.isEmpty()) {
            return List.of();
        }

        return cards.stream()
                .map(card -> {
                    if (card == null) {
                        throw new IllegalArgumentException("Value cards cannot contain null items.");
                    }

                    return card;
                })
                .map(card -> HomepageValueCardDto.builder()
                        .title(normalizeOptional(card.getTitle()))
                        .description(normalizeOptional(card.getDescription()))
                        .iconKey(card.getIconKey())
                        .build())
                .toList();
    }

    private String normalizeOptional(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        return value.trim();
    }

    private String normalizePageLink(String value, String fieldLabel) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            return null;
        }

        if (normalized.startsWith("/")) {
            return normalized;
        }

        return normalizeAbsoluteUrl(normalized, fieldLabel);
    }

    private String normalizeAssetUrl(String value, String fieldLabel) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            return null;
        }

        if (normalized.startsWith("/")) {
            return normalized;
        }

        return normalizeAbsoluteUrl(normalized, fieldLabel);
    }

    private String normalizeAbsoluteUrl(String value, String fieldLabel) {
        try {
            URI uri = URI.create(value);
            String scheme = uri.getScheme();

            if (scheme == null
                    || (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))) {
                throw new IllegalArgumentException(fieldLabel + " must use http or https.");
            }
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException(fieldLabel + " must be a valid absolute URL or site-relative path.");
        }

        return value;
    }

    private String normalizeHeroCustomTextColor(String value, HomepageHeroTextColorMode mode) {
        String normalized = normalizeOptional(value);

        if (mode != HomepageHeroTextColorMode.CUSTOM) {
            return null;
        }

        if (normalized == null) {
            throw new IllegalArgumentException("Custom hero text color is required when text color mode is CUSTOM.");
        }

        if (!HEX_COLOR_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Custom hero text color must be a valid hex color.");
        }

        return normalized.toUpperCase(Locale.ROOT);
    }

    private Integer normalizeOverlayStrength(Integer value) {
        if (value == null) {
            return 36;
        }

        if (value < 0 || value > 100) {
            throw new IllegalArgumentException("Hero overlay strength must be between 0 and 100.");
        }

        return value;
    }
}
