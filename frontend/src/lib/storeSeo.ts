import type { Metadata } from "next";

import { DEFAULT_PUBLIC_SHOP, type ShopPublicDto } from "@/types/shop";

type BuildStoreMetadataOptions = {
  shop: ShopPublicDto;
  pageTitle?: string | null;
  description?: string | null;
  fallbackDescription?: string | null;
  keywords?: string | null;
  ogImageUrl?: string | null;
};

const trimOptionalString = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export function buildMetadataTitle(
  shop: ShopPublicDto,
  pageTitle?: string | null,
) {
  const baseTitle =
    trimOptionalString(shop.seoTitle) ||
    trimOptionalString(shop.storeName) ||
    DEFAULT_PUBLIC_SHOP.storeName;
  const resolvedPageTitle = trimOptionalString(pageTitle);

  if (!resolvedPageTitle || resolvedPageTitle === baseTitle) {
    return baseTitle;
  }

  return `${resolvedPageTitle} | ${baseTitle}`;
}

export function buildMetadataDescription(
  shop: ShopPublicDto,
  description?: string | null,
  fallbackDescription?: string | null,
) {
  return (
    trimOptionalString(description) ||
    trimOptionalString(shop.seoDescription) ||
    trimOptionalString(fallbackDescription) ||
    trimOptionalString(shop.shortDescription) ||
    trimOptionalString(DEFAULT_PUBLIC_SHOP.shortDescription) ||
    undefined
  );
}

export function buildMetadataKeywords(
  keywords?: string | null,
  fallbackKeywords?: string | null,
) {
  const rawKeywords =
    trimOptionalString(keywords) || trimOptionalString(fallbackKeywords);

  if (!rawKeywords) {
    return undefined;
  }

  const parsedKeywords = rawKeywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return parsedKeywords.length > 0 ? parsedKeywords : undefined;
}

export function resolveMetadataImage(
  shop: ShopPublicDto,
  ogImageUrl?: string | null,
) {
  return trimOptionalString(ogImageUrl) || trimOptionalString(shop.ogImageUrl);
}

export function buildStoreMetadata({
  shop,
  pageTitle,
  description,
  fallbackDescription,
  keywords,
  ogImageUrl,
}: BuildStoreMetadataOptions): Metadata {
  const title = buildMetadataTitle(shop, pageTitle);
  const resolvedDescription = buildMetadataDescription(
    shop,
    description,
    fallbackDescription,
  );
  const resolvedKeywords = buildMetadataKeywords(keywords, shop.seoKeywords);
  const resolvedImage = resolveMetadataImage(shop, ogImageUrl);

  return {
    title,
    description: resolvedDescription,
    keywords: resolvedKeywords,
    openGraph: {
      title,
      description: resolvedDescription,
      images: resolvedImage ? [{ url: resolvedImage }] : undefined,
      type: "website",
    },
    twitter: {
      card: resolvedImage ? "summary_large_image" : "summary",
      title,
      description: resolvedDescription,
      images: resolvedImage ? [resolvedImage] : undefined,
    },
  };
}
