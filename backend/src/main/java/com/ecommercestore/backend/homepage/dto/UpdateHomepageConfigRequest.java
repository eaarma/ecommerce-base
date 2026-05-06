package com.ecommercestore.backend.homepage.dto;

import java.util.List;

import com.ecommercestore.backend.homepage.HomepageFeaturedSelectionMode;
import com.ecommercestore.backend.homepage.HomepageHeroButtonPosition;
import com.ecommercestore.backend.homepage.HomepageHeroTextColorMode;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class UpdateHomepageConfigRequest {

    @NotNull
    private Boolean heroEnabled;

    @Size(max = 255)
    private String heroTitle;

    @Size(max = 1000)
    private String heroSubtitle;

    @Size(max = 120)
    private String heroButtonText;

    @Size(max = 500)
    private String heroButtonLink;

    @NotNull
    private HomepageHeroButtonPosition heroButtonPosition;

    @Size(max = 500)
    private String heroImageUrl;

    @NotNull
    private HomepageHeroTextColorMode heroTextColorMode;

    @Size(max = 20)
    private String heroCustomTextColor;

    @NotNull
    @Min(0)
    @Max(100)
    private Integer heroOverlayStrength;

    @NotNull
    private Boolean featuredEnabled;

    @Size(max = 255)
    private String featuredTitle;

    @NotNull
    private HomepageFeaturedSelectionMode featuredSelectionMode;

    @NotNull
    @Size(max = 24)
    private List<Long> featuredProductIds;

    @NotNull
    @Min(1)
    private Integer featuredMaxItems;

    @NotNull
    private Boolean spotlightEnabled;

    private Long spotlightProductId;

    @Size(max = 120)
    private String spotlightBadgeTitle;

    @NotNull
    private Boolean collectionEnabled;

    @NotNull
    @Valid
    @Size(min = 4, max = 4)
    private List<HomepageCollectionBlockDto> collectionBlocks;

    @NotNull
    private Boolean valueSectionEnabled;

    @NotNull
    @Valid
    @Size(max = 12)
    private List<HomepageValueCardDto> valueCards;

    @NotNull
    private Boolean ctaEnabled;

    @Size(max = 255)
    private String ctaTitle;

    @Size(max = 1000)
    private String ctaDescription;
}
