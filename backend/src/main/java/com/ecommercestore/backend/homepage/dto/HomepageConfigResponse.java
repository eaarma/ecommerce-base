package com.ecommercestore.backend.homepage.dto;

import java.time.Instant;
import java.util.List;

import com.ecommercestore.backend.homepage.HomepageFeaturedSelectionMode;
import com.ecommercestore.backend.homepage.HomepageHeroButtonPosition;
import com.ecommercestore.backend.homepage.HomepageHeroTextColorMode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomepageConfigResponse {

    private Long id;

    private Boolean heroEnabled;
    private String heroTitle;
    private String heroSubtitle;
    private String heroButtonText;
    private String heroButtonLink;
    private HomepageHeroButtonPosition heroButtonPosition;
    private String heroImageUrl;
    private HomepageHeroTextColorMode heroTextColorMode;
    private String heroCustomTextColor;
    private Integer heroOverlayStrength;

    private Boolean featuredEnabled;
    private String featuredTitle;
    private HomepageFeaturedSelectionMode featuredSelectionMode;
    private List<Long> featuredProductIds;
    private Integer featuredMaxItems;

    private Boolean spotlightEnabled;
    private Long spotlightProductId;
    private String spotlightBadgeTitle;

    private Boolean collectionEnabled;
    private List<HomepageCollectionBlockDto> collectionBlocks;

    private Boolean valueSectionEnabled;
    private List<HomepageValueCardDto> valueCards;

    private Boolean ctaEnabled;
    private String ctaTitle;
    private String ctaDescription;

    private Instant createdAt;
    private Instant updatedAt;
}
