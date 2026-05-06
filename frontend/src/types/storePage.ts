export type StorePageStatus = "DRAFT" | "PUBLISHED";

export type StorePageSlug =
  | "about"
  | "contact"
  | "faq"
  | "privacy"
  | "terms"
  | "cancellation-refund"
  | "shipping";

export type ManagedStorePageSlug = Exclude<StorePageSlug, "contact">;

export type AboutBadgeCardDto = {
  title?: string | null;
  description?: string | null;
};

export type AboutPageContentDto = {
  heroTitle?: string | null;
  heroDescription?: string | null;
  badges?: AboutBadgeCardDto[];
  badgeCards?: AboutBadgeCardDto[];
  secondaryTitle?: string | null;
  secondaryBody?: string | null;
  secondaryDescription?: string | null;
  finalTitle?: string | null;
  finalBody?: string | null;
  finalDescription?: string | null;
  [key: string]: unknown;
};

export type PolicySectionDto = {
  title?: string | null;
  body?: string | null;
};

export type PolicyPageContentDto = {
  intro?: string | null;
  sections?: PolicySectionDto[];
  [key: string]: unknown;
};

export type FaqItemDto = {
  question?: string | null;
  answer?: string | null;
};

export type FaqPageContentDto = {
  intro?: string | null;
  items?: FaqItemDto[];
  [key: string]: unknown;
};

export type ContactPageContentDto = {
  intro?: string | null;
  detailsTitle?: string | null;
  detailsDescription?: string | null;
  formTitle?: string | null;
  formDescription?: string | null;
  [key: string]: unknown;
};

export type StorePageContentDto = Record<string, unknown>;

export type StorePageContentBySlug = {
  about: AboutPageContentDto;
  contact: ContactPageContentDto;
  faq: FaqPageContentDto;
  privacy: PolicyPageContentDto;
  terms: PolicyPageContentDto;
  "cancellation-refund": PolicyPageContentDto;
  shipping: PolicyPageContentDto;
};

export type StorePagePublicDto<TContent = StorePageContentDto> = {
  slug: StorePageSlug;
  title: string;
  description: string | null;
  contentJson: TContent;
  closingNote: string | null;
};

export type StorePageDto<TContent = StorePageContentDto> = {
  id: number;
  slug: StorePageSlug;
  title: string;
  description: string | null;
  contentJson: TContent;
  closingNote: string | null;
  status: StorePageStatus;
  createdAt: string;
  updatedAt: string;
};

export type UpdateStorePageRequestDto<TContent = StorePageContentDto> = {
  title: string;
  description: string | null;
  contentJson: TContent;
  closingNote: string | null;
  status: StorePageStatus;
};
