import {
  ArrowRight,
  Award,
  Leaf,
  Package,
  PhoneCall,
  type LucideIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import CategoryGrid, {
  CollectionShowcaseItem,
} from "@/components/home/CategoryGrid";
import HomeCtaSection from "@/components/home/HomeCtaSection";
import HighlightedItem from "@/components/home/HighlightedItem";
import ItemListHorizontal from "@/components/home/ItemListHorizontal";
import StoreValueCard from "@/components/home/StoreValueCard";
import WelcomeImage from "@/components/home/WelcomeImage";
import { getPublicHomepageConfigOrFallback } from "@/lib/homepageService";
import { ProductService } from "@/lib/productService";
import { getPublicShopOrFallback } from "@/lib/shopService";
import { buildStoreMetadata } from "@/lib/storeSeo";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  HomepageConfigPublicDto,
  HomepageHeroButtonPosition,
  HomepageHeroTextColorMode,
  HomepageValueIconKey,
} from "@/types/homepage";
import { ProductDto } from "@/types/product";

const DEFAULT_STORE_INTRO_TITLE = "Short store introduction";

const DEFAULT_STORE_INTRO_DESCRIPTION =
  "Learn more about the store, what it values, and how it approaches everyday shopping.";

const COLLECTION_ACCENT_CLASSES = [
  "bg-gradient-to-br from-sky-500/40 via-sky-900/70 to-slate-950/90",
  "bg-gradient-to-br from-emerald-500/40 via-emerald-900/60 to-slate-950/90",
  "bg-gradient-to-br from-amber-300/50 via-orange-700/70 to-slate-950/90",
  "bg-gradient-to-br from-rose-400/40 via-fuchsia-950/70 to-slate-950/90",
] as const;

const HERO_CONTENT_ALIGNMENT: Record<HomepageHeroButtonPosition, string> = {
  LEFT: "items-start text-left",
  CENTER: "items-center text-center",
  RIGHT: "items-end text-right",
};

const HERO_TEXT_MODE_STYLES: Record<
  Exclude<HomepageHeroTextColorMode, "CUSTOM">,
  {
    titleClassName: string;
    subtitleClassName: string;
  }
> = {
  AUTO: {
    titleClassName:
      "text-white drop-shadow-[0_2px_10px_rgba(15,23,42,0.32)]",
    subtitleClassName:
      "text-white/88 drop-shadow-[0_2px_10px_rgba(15,23,42,0.28)]",
  },
  LIGHT: {
    titleClassName:
      "text-white drop-shadow-[0_2px_12px_rgba(15,23,42,0.36)]",
    subtitleClassName:
      "text-white/90 drop-shadow-[0_2px_12px_rgba(15,23,42,0.32)]",
  },
  DARK: {
    titleClassName:
      "text-slate-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.18)]",
    subtitleClassName:
      "text-slate-900/88 drop-shadow-[0_1px_2px_rgba(255,255,255,0.14)]",
  },
};

const VALUE_ICON_MAP: Record<HomepageValueIconKey, LucideIcon> = {
  QUALITY: Award,
  DELIVERY: Package,
  SECURE_PAYMENT: ShieldCheck,
  SUPPORT: PhoneCall,
  HANDMADE: Sparkles,
  SUSTAINABLE: Leaf,
};

const sortByUpdatedAtDesc = (a: ProductDto, b: ProductDto) =>
  getTimestamp(b.updatedAt) - getTimestamp(a.updatedAt);

const sortByStockDesc = (a: ProductDto, b: ProductDto) =>
  b.stockQuantity - a.stockQuantity;

const sortByPriceDesc = (a: ProductDto, b: ProductDto) =>
  Number(b.price) - Number(a.price);

const sortByLowStock = (a: ProductDto, b: ProductDto) =>
  a.stockQuantity - b.stockQuantity;

function getTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getStorefrontProducts(products: ProductDto[]) {
  const visibleProducts = products.filter(
    (product) => product.status !== "ARCHIVED" && product.status !== "DRAFT",
  );

  return visibleProducts.length > 0 ? visibleProducts : products;
}

function normalizeHomepageProducts(products: ProductDto[]) {
  return products.map((product) => ({
    ...product,
    imageUrl: product.imageUrl ?? product.mainImageUrl,
  }));
}

function dedupeProducts(products: ProductDto[]) {
  const seen = new Set<number>();

  return products.filter((product) => {
    if (seen.has(product.id)) {
      return false;
    }

    seen.add(product.id);
    return true;
  });
}

function buildProductsById(products: ProductDto[]) {
  return new Map(products.map((product) => [product.id, product]));
}

function shuffleProducts(products: ProductDto[]) {
  const shuffledProducts = [...products];

  for (let index = shuffledProducts.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1));
    const currentValue = shuffledProducts[index];

    shuffledProducts[index] = shuffledProducts[nextIndex];
    shuffledProducts[nextIndex] = currentValue;
  }

  return shuffledProducts;
}

function resolveFeaturedLimit(homepageConfig: HomepageConfigPublicDto) {
  const fallbackLimit = DEFAULT_HOMEPAGE_CONFIG.featuredMaxItems;
  const configuredLimit = Number(homepageConfig.featuredMaxItems);

  if (!Number.isFinite(configuredLimit) || configuredLimit < 1) {
    return fallbackLimit;
  }

  return Math.floor(configuredLimit);
}

function buildManualProductSelection(
  productIds: number[],
  productsById: Map<number, ProductDto>,
) {
  const seen = new Set<number>();

  return productIds.flatMap((productId) => {
    if (seen.has(productId)) {
      return [];
    }

    const product = productsById.get(productId);
    if (!product) {
      return [];
    }

    seen.add(productId);
    return [product];
  });
}

function buildFeaturedProducts(
  products: ProductDto[],
  homepageConfig: HomepageConfigPublicDto,
) {
  const limit = resolveFeaturedLimit(homepageConfig);
  const productsById = buildProductsById(products);

  if (homepageConfig.featuredSelectionMode === "MANUAL") {
    return buildManualProductSelection(
      homepageConfig.featuredProductIds,
      productsById,
    ).slice(0, limit);
  }

  if (homepageConfig.featuredSelectionMode === "RANDOM") {
    return shuffleProducts(products).slice(0, limit);
  }

  return [...products].sort(sortByUpdatedAtDesc).slice(0, limit);
}

function resolveSpotlightProduct(
  products: ProductDto[],
  homepageConfig: HomepageConfigPublicDto,
  featuredProducts: ProductDto[],
) {
  const productsById = buildProductsById(products);

  if (homepageConfig.spotlightProductId != null) {
    return productsById.get(homepageConfig.spotlightProductId) ?? null;
  }

  return (
    featuredProducts[0] ?? [...products].sort(sortByUpdatedAtDesc)[0] ?? null
  );
}

function buildCollectionFallbackProducts(products: ProductDto[]) {
  const inStockProducts = products.filter(
    (product) => product.stockQuantity > 0,
  );

  return dedupeProducts([
    ...[...products].sort(sortByUpdatedAtDesc),
    ...[...products].sort(sortByStockDesc),
    ...[...products].sort(sortByPriceDesc),
    ...[...inStockProducts].sort(sortByLowStock),
  ]);
}

function pickFallbackCollectionProduct(
  candidates: ProductDto[],
  usedProductIds: Set<number>,
) {
  const availableProduct =
    candidates.find((candidate) => !usedProductIds.has(candidate.id)) ??
    candidates[0] ??
    null;

  if (availableProduct) {
    usedProductIds.add(availableProduct.id);
  }

  return availableProduct;
}

function buildCollectionItems(
  products: ProductDto[],
  homepageConfig: HomepageConfigPublicDto,
) {
  const productsById = buildProductsById(products);
  const fallbackProducts = buildCollectionFallbackProducts(products);
  const usedProductIds = new Set<number>();

  return DEFAULT_HOMEPAGE_CONFIG.collectionBlocks.map((defaultBlock, index) => {
    const configuredBlock = homepageConfig.collectionBlocks[index];
    const resolvedBlock = configuredBlock ?? defaultBlock;
    const configuredProductId = resolvedBlock.productId;

    let linkedProduct =
      configuredProductId != null
        ? (productsById.get(configuredProductId) ?? null)
        : null;

    if (linkedProduct) {
      usedProductIds.add(linkedProduct.id);
    } else {
      linkedProduct = pickFallbackCollectionProduct(
        fallbackProducts,
        usedProductIds,
      );
    }

    return {
      title: resolvedBlock.title ?? defaultBlock.title ?? "Featured collection",
      eyebrow: resolvedBlock.badge ?? defaultBlock.badge ?? "Explore",
      description:
        resolvedBlock.description ?? defaultBlock.description ?? undefined,
      note: linkedProduct
        ? `Featuring ${linkedProduct.name}`
        : "Browse the current catalog",
      href: linkedProduct ? `/products/${linkedProduct.id}` : "/products",
      imageUrl: linkedProduct?.imageUrl ?? null,
      accentClassName: COLLECTION_ACCENT_CLASSES[index],
    } satisfies CollectionShowcaseItem;
  });
}

function buildStoreIntroDescription(
  shortDescription: string | null,
  longDescription: string | null,
) {
  return (
    shortDescription?.trim() ||
    longDescription?.trim() ||
    DEFAULT_STORE_INTRO_DESCRIPTION
  );
}

function buildValueCards(homepageConfig: HomepageConfigPublicDto) {
  return homepageConfig.valueCards.filter(
    (card) =>
      card.iconKey != null &&
      Boolean(card.title?.trim()) &&
      Boolean(card.description?.trim()),
  );
}

function resolveHeroTextPresentation(homepageConfig: HomepageConfigPublicDto) {
  const mode =
    homepageConfig.heroTextColorMode ??
    DEFAULT_HOMEPAGE_CONFIG.heroTextColorMode;

  if (mode === "CUSTOM") {
    const customTextColor =
      homepageConfig.heroCustomTextColor?.trim() || "#FFFFFF";

    return {
      titleClassName:
        "drop-shadow-[0_2px_12px_rgba(15,23,42,0.34)]",
      subtitleClassName:
        "drop-shadow-[0_2px_12px_rgba(15,23,42,0.28)]",
      customTextStyle: {
        color: customTextColor,
      },
    };
  }

  const preset =
    HERO_TEXT_MODE_STYLES[mode] ?? HERO_TEXT_MODE_STYLES.AUTO;

  return {
    ...preset,
    customTextStyle: undefined,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const shop = await getPublicShopOrFallback();

  return buildStoreMetadata({
    shop,
    fallbackDescription: shop.shortDescription,
  });
}

export default async function Home() {
  const productsPromise = ProductService.getAllProducts()
    .then((products) => ({
      error: null as string | null,
      products,
    }))
    .catch(() => ({
      error: "Live product data is temporarily unavailable.",
      products: [] as ProductDto[],
    }));

  const [shop, homepageConfig, productState] = await Promise.all([
    getPublicShopOrFallback(),
    getPublicHomepageConfigOrFallback(),
    productsPromise,
  ]);

  const storefrontProducts = normalizeHomepageProducts(
    getStorefrontProducts(productState.products),
  );
  const featuredProducts = buildFeaturedProducts(
    storefrontProducts,
    homepageConfig,
  );
  const spotlightProduct = resolveSpotlightProduct(
    storefrontProducts,
    homepageConfig,
    featuredProducts,
  );
  const collectionItems = buildCollectionItems(
    storefrontProducts,
    homepageConfig,
  );
  const valueCards = buildValueCards(homepageConfig);
  const heroTitle =
    homepageConfig.heroTitle?.trim() ||
    shop.tagline?.trim() ||
    DEFAULT_HOMEPAGE_CONFIG.heroTitle ||
    shop.storeName;
  const heroSubtitle =
    homepageConfig.heroSubtitle?.trim() ||
    buildStoreIntroDescription(shop.shortDescription, shop.longDescription);
  const heroButtonText = homepageConfig.heroButtonText?.trim() || null;
  const heroButtonLink = homepageConfig.heroButtonLink?.trim() || null;
  const heroImageUrl =
    homepageConfig.heroImageUrl?.trim() ||
    DEFAULT_HOMEPAGE_CONFIG.heroImageUrl ||
    "/default_image.png";
  const heroOverlayStrength =
    Number.isFinite(homepageConfig.heroOverlayStrength) &&
    homepageConfig.heroOverlayStrength >= 0 &&
    homepageConfig.heroOverlayStrength <= 100
      ? homepageConfig.heroOverlayStrength
      : DEFAULT_HOMEPAGE_CONFIG.heroOverlayStrength;
  const heroCardAlignment =
    HERO_CONTENT_ALIGNMENT[
      homepageConfig.heroButtonPosition ??
        DEFAULT_HOMEPAGE_CONFIG.heroButtonPosition
    ];
  const heroTextPresentation = resolveHeroTextPresentation(homepageConfig);
  const featuredTitle =
    homepageConfig.featuredTitle?.trim() ||
    DEFAULT_HOMEPAGE_CONFIG.featuredTitle ||
    "Featured picks";
  const spotlightBadgeTitle =
    homepageConfig.spotlightBadgeTitle?.trim() || "Store spotlight";
  const storeIntroDescription = buildStoreIntroDescription(
    shop.shortDescription,
    shop.longDescription,
  );
  const ctaTitle =
    homepageConfig.ctaTitle?.trim() || DEFAULT_HOMEPAGE_CONFIG.ctaTitle;
  const ctaDescription =
    homepageConfig.ctaDescription?.trim() ||
    DEFAULT_HOMEPAGE_CONFIG.ctaDescription;

  return (
    <div className="min-h-screen bg-base-100 font-sans">
      <main className="flex flex-col gap-14 pb-8 pt-0 sm:gap-16 sm:py-10">
        {homepageConfig.heroEnabled ? (
          <WelcomeImage
            imageUrl={heroImageUrl}
            contentPosition={homepageConfig.heroButtonPosition}
            overlayStrength={heroOverlayStrength}
          >
            <div
              className={`flex max-w-[min(100%,22rem)] flex-col gap-3 rounded-xl p-4 sm:max-w-2xl sm:gap-4 sm:p-8 ${heroCardAlignment}`}
              style={heroTextPresentation.customTextStyle}
            >
              <div className="space-y-2 sm:space-y-3">
                <h1
                  className={`text-xl font-semibold leading-tight tracking-tight sm:text-4xl ${heroTextPresentation.titleClassName}`}
                >
                  {heroTitle}
                </h1>
                <p
                  className={`text-sm leading-6 sm:text-lg sm:leading-7 ${heroTextPresentation.subtitleClassName}`}
                >
                  {heroSubtitle}
                </p>
              </div>

              {heroButtonText && heroButtonLink ? (
                <div className="pt-1">
                  <Link
                    href={heroButtonLink}
                    className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/96 px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-[0_14px_35px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:border-primary/45 hover:bg-white hover:text-primary sm:px-5 sm:py-3 sm:text-sm"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full bg-primary"
                    />
                    {heroButtonText}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : null}
            </div>
          </WelcomeImage>
        ) : null}

        {productState.error ? (
          <section className="rounded-[28px] border border-warning/30 bg-warning/10 px-5 py-4 text-sm text-base-content sm:px-6">
            {productState.error} You can still head to the Products page to keep
            browsing.
          </section>
        ) : null}

        {homepageConfig.featuredEnabled ? (
          <ItemListHorizontal
            title={featuredTitle}
            products={featuredProducts}
          />
        ) : null}

        {homepageConfig.spotlightEnabled &&
        spotlightProduct &&
        homepageConfig.collectionEnabled ? (
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <HighlightedItem
              product={spotlightProduct}
              title={spotlightBadgeTitle}
              description="A closer look at one product currently featured on the storefront."
            />
            <CategoryGrid title="Explore the catalog" items={collectionItems} />
          </div>
        ) : (
          <>
            {homepageConfig.spotlightEnabled && spotlightProduct ? (
              <HighlightedItem
                product={spotlightProduct}
                title={spotlightBadgeTitle}
                description="A closer look at one product currently featured on the storefront."
              />
            ) : null}

            {homepageConfig.collectionEnabled ? (
              <CategoryGrid
                title="Explore the catalog"
                items={collectionItems}
              />
            ) : null}
          </>
        )}

        {homepageConfig.valueSectionEnabled && valueCards.length > 0 ? (
          <section className="space-y-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                Why shop here
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-base-content sm:text-4xl">
                A store experience built to feel considered from first click to
                checkout
              </h2>
              <p className="text-base leading-7 text-base-content/70">
                These are the qualities the storefront is designed to signal at
                a glance: care, dependability, and products chosen with
                intention.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {valueCards.map((card, index) => {
                const Icon = VALUE_ICON_MAP[card.iconKey ?? "QUALITY"];

                return (
                  <StoreValueCard
                    key={`${card.title}-${index}`}
                    icon={Icon}
                    title={card.title?.trim() || "Store value"}
                    description={card.description?.trim() || ""}
                  />
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="rounded-[30px] border border-base-300 bg-gradient-to-br from-base-100 via-base-200/45 to-base-100 px-6 py-8 shadow-sm sm:px-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                About {shop.storeName}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-base-content sm:text-4xl">
                {DEFAULT_STORE_INTRO_TITLE}
              </h2>
              <p className="text-base leading-7 text-base-content/70 sm:text-lg">
                {storeIntroDescription}
              </p>
            </div>

            <div>
              <Link href="/about" className="btn btn-outline rounded-full px-6">
                Learn more about us
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {homepageConfig.ctaEnabled ? (
          <HomeCtaSection title={ctaTitle} description={ctaDescription} />
        ) : null}
      </main>
    </div>
  );
}
