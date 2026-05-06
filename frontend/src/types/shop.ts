export type ShopThemeMode =
  | "LIGHT"
  | "DARK"
  | "WARM"
  | "LUXURY"
  | "MINIMAL"
  | "MODERN"
  | "NATURE"
  | "PLAYFUL"
  | "PASTEL"
  | "CONTRAST"
  | "SYSTEM";

export type StoreThemePreset = Exclude<ShopThemeMode, "SYSTEM">;

export type ShopPublicDto = {
  storeName: string;
  tagline: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  contactEmail: string | null;
  supportEmail: string | null;
  phoneNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  businessHours: string | null;
  showAddress: boolean;
  showPhone: boolean;
  showSupportEmail: boolean;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  xUrl: string | null;
  primaryColor: string;
  accentColor: string;
  themeMode: ShopThemeMode;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogImageUrl: string | null;
};

export type UpdateShopRequestDto = ShopPublicDto & {
  contactReceiverEmail: string | null;
};

export type ManagerShopDto = UpdateShopRequestDto & {
  id: number;
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_PUBLIC_SHOP: ShopPublicDto = {
  storeName: "Ecommerce Store",
  tagline: null,
  shortDescription: "We sell goods.",
  longDescription: null,
  logoUrl: null,
  faviconUrl: null,
  contactEmail: null,
  supportEmail: null,
  phoneNumber: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  postalCode: null,
  country: null,
  businessHours: null,
  showAddress: true,
  showPhone: true,
  showSupportEmail: true,
  instagramUrl: null,
  facebookUrl: null,
  tiktokUrl: null,
  xUrl: null,
  primaryColor: "#0284c7",
  accentColor: "#f59e0b",
  themeMode: "LIGHT",
  seoTitle: null,
  seoDescription: null,
  seoKeywords: null,
  ogImageUrl: null,
};
