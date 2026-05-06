import type { ManagerShopDto, UpdateShopRequestDto } from "@/types/shop";

export const normalizeOptionalString = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export function toUpdateShopRequest(
  shop: Pick<ManagerShopDto, keyof UpdateShopRequestDto>,
): UpdateShopRequestDto {
  return {
    storeName: shop.storeName,
    tagline: shop.tagline,
    shortDescription: shop.shortDescription,
    longDescription: shop.longDescription,
    logoUrl: shop.logoUrl,
    faviconUrl: shop.faviconUrl,
    contactEmail: shop.contactEmail,
    supportEmail: shop.supportEmail,
    contactReceiverEmail: shop.contactReceiverEmail,
    phoneNumber: shop.phoneNumber,
    addressLine1: shop.addressLine1,
    addressLine2: shop.addressLine2,
    city: shop.city,
    postalCode: shop.postalCode,
    country: shop.country,
    businessHours: shop.businessHours,
    showAddress: shop.showAddress,
    showPhone: shop.showPhone,
    showSupportEmail: shop.showSupportEmail,
    instagramUrl: shop.instagramUrl,
    facebookUrl: shop.facebookUrl,
    tiktokUrl: shop.tiktokUrl,
    xUrl: shop.xUrl,
    primaryColor: shop.primaryColor,
    accentColor: shop.accentColor,
    themeMode: shop.themeMode,
    seoTitle: shop.seoTitle,
    seoDescription: shop.seoDescription,
    seoKeywords: shop.seoKeywords,
    ogImageUrl: shop.ogImageUrl,
  };
}

export function mergeShopUpdateRequest(
  shop: Pick<ManagerShopDto, keyof UpdateShopRequestDto>,
  overrides: Partial<UpdateShopRequestDto>,
): UpdateShopRequestDto {
  return {
    ...toUpdateShopRequest(shop),
    ...overrides,
  };
}
