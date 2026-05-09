import { DEFAULT_PUBLIC_STORE_PAGES } from "@/lib/storePageDefaults";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";
import type {
  AboutBadgeCardDto,
  AboutPageContentDto,
  ContactPageContentDto,
  FaqItemDto,
  FaqPageContentDto,
  PolicyPageContentDto,
  PolicySectionDto,
  StorePageContentBySlug,
  StorePagePublicDto,
  StorePageSlug,
} from "@/types/storePage";

const baseURL = getApiBaseUrl();

type ApiRequestError = Error & {
  status: number;
};

const createRequestError = (
  message: string,
  status: number,
): ApiRequestError => {
  const error = new Error(`${message}: ${status}`) as ApiRequestError;
  error.status = status;
  return error;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readOptionalString = (value: unknown) =>
  typeof value === "string" ? value.trim() : null;

const readArray = (value: unknown) => (Array.isArray(value) ? value : []);

function normalizeAboutBadges(
  value: unknown,
  fallback: AboutBadgeCardDto[],
): AboutBadgeCardDto[] {
  const badges = readArray(value)
    .map((badge) => {
      const badgeRecord = isRecord(badge) ? badge : {};
      const title = readOptionalString(badgeRecord.title);
      const description = readOptionalString(badgeRecord.description);

      if (!title && !description) {
        return null;
      }

      return {
        title,
        description,
      };
    })
    .filter(
      (
        badge,
      ): badge is {
        title: string | null;
        description: string | null;
      } => badge !== null,
    );

  return badges.length > 0 ? badges : fallback;
}

function normalizePolicySections(
  value: unknown,
  fallback: PolicySectionDto[],
): PolicySectionDto[] {
  const sections = readArray(value)
    .map((section) => {
      const sectionRecord = isRecord(section) ? section : {};
      const title = readOptionalString(sectionRecord.title);
      const body = readOptionalString(sectionRecord.body);

      if (!title && !body) {
        return null;
      }

      return {
        title,
        body,
      };
    })
    .filter(
      (
        section,
      ): section is {
        title: string | null;
        body: string | null;
      } => section !== null,
    );

  return sections.length > 0 ? sections : fallback;
}

function normalizeFaqItems(
  value: unknown,
  fallback: FaqItemDto[],
): FaqItemDto[] {
  const items = readArray(value)
    .map((item) => {
      const itemRecord = isRecord(item) ? item : {};
      const question = readOptionalString(itemRecord.question);
      const answer = readOptionalString(itemRecord.answer);

      if (!question && !answer) {
        return null;
      }

      return {
        question,
        answer,
      };
    })
    .filter(
      (
        item,
      ): item is {
        question: string | null;
        answer: string | null;
      } => item !== null,
    );

  return items.length > 0 ? items : fallback;
}

function normalizeAboutContent(value: unknown): AboutPageContentDto {
  const fallback = DEFAULT_PUBLIC_STORE_PAGES.about
    .contentJson as AboutPageContentDto;
  const content = isRecord(value) ? value : {};

  return {
    heroTitle:
      readOptionalString(content.heroTitle ?? content.mainTitle) ??
      fallback.heroTitle ??
      null,
    heroDescription:
      readOptionalString(content.heroDescription ?? content.mainDescription) ??
      fallback.heroDescription ??
      null,
    badges: normalizeAboutBadges(
      content.badges ?? content.badgeCards,
      fallback.badges ?? [],
    ),
    secondaryTitle:
      readOptionalString(content.secondaryTitle) ?? fallback.secondaryTitle ?? null,
    secondaryBody:
      readOptionalString(content.secondaryBody ?? content.secondaryDescription) ??
      fallback.secondaryBody ??
      fallback.secondaryDescription ??
      null,
    finalTitle:
      readOptionalString(content.finalTitle) ?? fallback.finalTitle ?? null,
    finalBody:
      readOptionalString(content.finalBody ?? content.finalDescription) ??
      fallback.finalBody ??
      fallback.finalDescription ??
      null,
  };
}

function normalizeContactContent(value: unknown): ContactPageContentDto {
  const fallback = DEFAULT_PUBLIC_STORE_PAGES.contact
    .contentJson as ContactPageContentDto;
  const content = isRecord(value) ? value : {};

  return {
    intro: readOptionalString(content.intro) ?? fallback.intro ?? null,
    detailsTitle:
      readOptionalString(content.detailsTitle) ?? fallback.detailsTitle ?? null,
    detailsDescription:
      readOptionalString(content.detailsDescription) ??
      fallback.detailsDescription ??
      null,
    formTitle: readOptionalString(content.formTitle) ?? fallback.formTitle ?? null,
    formDescription:
      readOptionalString(content.formDescription) ??
      fallback.formDescription ??
      null,
  };
}

function normalizeFaqContent(value: unknown): FaqPageContentDto {
  const fallback = DEFAULT_PUBLIC_STORE_PAGES.faq.contentJson as FaqPageContentDto;
  const content = isRecord(value) ? value : {};

  return {
    intro: readOptionalString(content.intro) ?? fallback.intro ?? null,
    items: normalizeFaqItems(content.items, fallback.items ?? []),
  };
}

function normalizePolicyContent(
  slug: Extract<
    StorePageSlug,
    "privacy" | "terms" | "cancellation-refund" | "shipping"
  >,
  value: unknown,
): PolicyPageContentDto {
  const fallback = DEFAULT_PUBLIC_STORE_PAGES[slug]
    .contentJson as PolicyPageContentDto;
  const content = isRecord(value) ? value : {};

  return {
    intro: readOptionalString(content.intro) ?? fallback.intro ?? null,
    sections: normalizePolicySections(content.sections, fallback.sections ?? []),
  };
}

function normalizePageContent<TSlug extends StorePageSlug>(
  slug: TSlug,
  value: unknown,
): StorePageContentBySlug[TSlug] {
  switch (slug) {
    case "about":
      return normalizeAboutContent(value) as StorePageContentBySlug[TSlug];
    case "contact":
      return normalizeContactContent(value) as StorePageContentBySlug[TSlug];
    case "faq":
      return normalizeFaqContent(value) as StorePageContentBySlug[TSlug];
    case "privacy":
    case "terms":
    case "cancellation-refund":
    case "shipping":
      return normalizePolicyContent(slug, value) as StorePageContentBySlug[TSlug];
    default:
      return DEFAULT_PUBLIC_STORE_PAGES[slug]
        .contentJson as StorePageContentBySlug[TSlug];
  }
}

function normalizePublicStorePage<TSlug extends StorePageSlug>(
  slug: TSlug,
  value: unknown,
): StorePagePublicDto<StorePageContentBySlug[TSlug]> {
  const fallback = DEFAULT_PUBLIC_STORE_PAGES[slug] as StorePagePublicDto<
    StorePageContentBySlug[TSlug]
  >;
  const page = isRecord(value) ? value : {};

  return {
    slug,
    title: readOptionalString(page.title) ?? fallback.title,
    description:
      page.description === null
        ? null
        : readOptionalString(page.description) ?? fallback.description,
    contentJson: normalizePageContent(slug, page.contentJson),
    closingNote:
      page.closingNote === null
        ? null
        : readOptionalString(page.closingNote) ?? fallback.closingNote,
  };
}

export const StorePageService = {
  getPublicPage: async <TSlug extends StorePageSlug>(
    slug: TSlug,
  ): Promise<StorePagePublicDto<StorePageContentBySlug[TSlug]>> => {
    const response = await fetch(new URL(`/api/store/pages/${slug}`, baseURL), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw createRequestError("Failed to load store page", response.status);
    }

    return normalizePublicStorePage(slug, await response.json());
  },
};

export async function getPublicStorePageOrFallback<TSlug extends StorePageSlug>(
  slug: TSlug,
): Promise<StorePagePublicDto<StorePageContentBySlug[TSlug]>> {
  try {
    return await StorePageService.getPublicPage(slug);
  } catch {
    return DEFAULT_PUBLIC_STORE_PAGES[slug] as StorePagePublicDto<
      StorePageContentBySlug[TSlug]
    >;
  }
}
