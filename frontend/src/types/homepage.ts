export type HomepageHeroButtonPosition = "LEFT" | "CENTER" | "RIGHT";

export type HomepageHeroTextColorMode = "AUTO" | "LIGHT" | "DARK" | "CUSTOM";

export type HomepageFeaturedSelectionMode = "MANUAL" | "RANDOM" | "LATEST";

export type HomepageValueIconKey =
  | "QUALITY"
  | "DELIVERY"
  | "SECURE_PAYMENT"
  | "SUPPORT"
  | "HANDMADE"
  | "SUSTAINABLE";

export type HomepageCollectionBlockDto = {
  badge: string | null;
  title: string | null;
  description: string | null;
  productId: number | null;
};

export type HomepageValueCardDto = {
  title: string | null;
  description: string | null;
  iconKey: HomepageValueIconKey | null;
};

export type HomepageConfigFields = {
  heroEnabled: boolean;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroButtonText: string | null;
  heroButtonLink: string | null;
  heroButtonPosition: HomepageHeroButtonPosition;
  heroImageUrl: string | null;
  heroTextColorMode: HomepageHeroTextColorMode;
  heroCustomTextColor: string | null;
  heroOverlayStrength: number;
  featuredEnabled: boolean;
  featuredTitle: string | null;
  featuredSelectionMode: HomepageFeaturedSelectionMode;
  featuredProductIds: number[];
  featuredMaxItems: number;
  spotlightEnabled: boolean;
  spotlightProductId: number | null;
  spotlightBadgeTitle: string | null;
  collectionEnabled: boolean;
  collectionBlocks: HomepageCollectionBlockDto[];
  valueSectionEnabled: boolean;
  valueCards: HomepageValueCardDto[];
  ctaEnabled: boolean;
  ctaTitle: string | null;
  ctaDescription: string | null;
};

export type HomepageConfigPublicDto = HomepageConfigFields;

export type HomepageConfigDto = HomepageConfigFields & {
  id: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateHomepageConfigRequestDto = HomepageConfigFields;

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfigPublicDto = {
  heroEnabled: true,
  heroTitle: "A warmer, easier storefront for products worth bringing home",
  heroSubtitle:
    "Browse a curated catalog with clear stock visibility, dependable product pages, and a calm path from discovery to checkout.",
  heroButtonText: "Browse products",
  heroButtonLink: "/products",
  heroButtonPosition: "LEFT",
  heroImageUrl: "/default_image.png",
  heroTextColorMode: "AUTO",
  heroCustomTextColor: null,
  heroOverlayStrength: 36,
  featuredEnabled: true,
  featuredTitle: "Featured picks",
  featuredSelectionMode: "LATEST",
  featuredProductIds: [],
  featuredMaxItems: 6,
  spotlightEnabled: true,
  spotlightProductId: null,
  spotlightBadgeTitle: "Store spotlight",
  collectionEnabled: true,
  collectionBlocks: [
    {
      badge: "Just in",
      title: "Fresh arrivals",
      description: "Discover what is new in store",
      productId: null,
    },
    {
      badge: "Well stocked",
      title: "Ready to ship",
      description: "Browse dependable everyday picks",
      productId: null,
    },
    {
      badge: "Editor pick",
      title: "Signature pieces",
      description: "Explore standout products",
      productId: null,
    },
    {
      badge: "Low stock",
      title: "Limited run",
      description: "Take a look before stock runs low",
      productId: null,
    },
  ],
  valueSectionEnabled: true,
  valueCards: [
    {
      title: "Local care",
      description:
        "A smaller-store feeling with product choices that feel personal rather than mass-picked.",
      iconKey: "SUPPORT",
    },
    {
      title: "Reliable service",
      description:
        "Clear stock visibility, consistent product details, and a direct path from browsing to order.",
      iconKey: "SECURE_PAYMENT",
    },
    {
      title: "Thoughtful choices",
      description:
        "A calmer catalog focused on useful products, careful sourcing, and less throwaway shopping.",
      iconKey: "SUSTAINABLE",
    },
  ],
  ctaEnabled: true,
  ctaTitle: "Ready to browse the catalog or ask a question before you buy?",
  ctaDescription:
    "Keep exploring products, or head straight to the contact page if you want help choosing, ordering, or learning more about the store.",
};
