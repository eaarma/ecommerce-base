import type { Metadata } from "next";
import { Mail, MapPinned, PhoneCall } from "lucide-react";

import StructuredText from "@/components/common/StructuredText";
import { getPublicShopOrFallback } from "@/lib/shopService";
import { buildStoreMetadata } from "@/lib/storeSeo";
import { getPublicStorePageOrFallback } from "@/lib/storePageService";
import type { AboutPageContentDto } from "@/types/storePage";

function buildLocationSummary(city: string | null, country: string | null) {
  const locationParts = [city?.trim(), country?.trim()].filter(Boolean);

  return locationParts.length > 0
    ? locationParts.join(", ")
    : "Built for customers who value clarity, care, and practical choices.";
}

function getAboutBadges(content: AboutPageContentDto) {
  return (content.badges ?? content.badgeCards ?? []).filter(
    (badge) => badge.title?.trim() || badge.description?.trim(),
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const [shop, aboutPage] = await Promise.all([
    getPublicShopOrFallback(),
    getPublicStorePageOrFallback("about"),
  ]);

  return buildStoreMetadata({
    shop,
    pageTitle: aboutPage.title,
    description: aboutPage.description,
    fallbackDescription: shop.shortDescription,
  });
}

export default async function AboutPage() {
  const [shop, aboutPage] = await Promise.all([
    getPublicShopOrFallback(),
    getPublicStorePageOrFallback("about"),
  ]);

  const content = aboutPage.contentJson;
  const badges = getAboutBadges(content);
  const locationSummary = buildLocationSummary(shop.city, shop.country);
  const supportEmail = shop.supportEmail?.trim() || shop.contactEmail?.trim();
  const phoneNumber = shop.phoneNumber?.trim();
  const heroTitle =
    content.heroTitle?.trim() || shop.tagline?.trim() || aboutPage.title;
  const heroDescription =
    content.heroDescription?.trim() ||
    shop.shortDescription?.trim() ||
    shop.longDescription?.trim() ||
    aboutPage.description?.trim() ||
    null;
  const secondaryTitle =
    content.secondaryTitle?.trim() || "A better everyday shopping experience.";
  const secondaryBody =
    content.secondaryBody?.trim() ||
    content.secondaryDescription?.trim() ||
    null;
  const finalTitle =
    content.finalTitle?.trim() || `Thank you for supporting ${shop.storeName}.`;
  const finalBody =
    content.finalBody?.trim() ||
    content.finalDescription?.trim() ||
    aboutPage.closingNote?.trim() ||
    null;

  return (
    <div className="min-h-screen bg-base-100 font-sans">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-8 lg:px-12">
        <section className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6 p-8 sm:p-12 lg:p-14">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                About {shop.storeName}
              </p>

              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-base-content sm:text-5xl">
                {heroTitle}
              </h1>

              {heroDescription ? (
                <StructuredText
                  text={heroDescription}
                  className="max-w-2xl text-base text-base-content/70 sm:text-lg"
                  paragraphClassName="leading-8 whitespace-pre-line"
                  listClassName="list-disc space-y-1 pl-5 text-base-content/70"
                />
              ) : null}
            </div>

            <div className="flex min-h-[280px] items-center justify-center bg-base-200 p-8">
              <div className="w-full max-w-sm rounded-3xl border border-base-300 bg-base-100 p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Store profile
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-base-content">
                  {shop.storeName}
                </h2>

                <div className="mt-6 space-y-4 text-sm text-base-content/70">
                  <div className="flex items-start gap-3">
                    <MapPinned className="mt-0.5 h-4 w-4 text-primary" />
                    <p>{locationSummary}</p>
                  </div>

                  {supportEmail ? (
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-4 w-4 text-primary" />
                      <p>{supportEmail}</p>
                    </div>
                  ) : null}

                  {phoneNumber ? (
                    <div className="flex items-start gap-3">
                      <PhoneCall className="mt-0.5 h-4 w-4 text-primary" />
                      <p>{phoneNumber}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        {badges.length > 0 ? (
          <section className="grid gap-6 md:grid-cols-3">
            {badges.map((badge, index) => (
              <div
                key={`${badge.title ?? "about-badge"}-${index}`}
                className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm"
              >
                {badge.title?.trim() ? (
                  <h2 className="text-xl font-bold text-base-content">
                    {badge.title}
                  </h2>
                ) : null}

                {badge.description?.trim() ? (
                  <StructuredText
                    text={badge.description}
                    className="mt-3 text-sm text-base-content/70"
                    paragraphClassName="leading-6 whitespace-pre-line"
                    listClassName="list-disc space-y-1 pl-5 text-base-content/70"
                  />
                ) : null}
              </div>
            ))}
          </section>
        ) : null}

        {(secondaryTitle || secondaryBody) && (
          <section className="rounded-3xl border border-base-300 bg-base-200 p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Our promise
                </p>
                <h2 className="mt-3 text-3xl font-bold text-base-content">
                  {secondaryTitle}
                </h2>
              </div>

              {secondaryBody ? (
                <StructuredText
                  text={secondaryBody}
                  className="space-y-4 text-base text-base-content/70"
                  paragraphClassName="leading-7 whitespace-pre-line"
                  listClassName="list-disc space-y-1 pl-5 text-base-content/70"
                />
              ) : null}
            </div>
          </section>
        )}

        {(finalTitle || finalBody) && (
          <section className="rounded-3xl border border-base-300 bg-base-100 p-8 text-center shadow-sm sm:p-10">
            {finalTitle ? (
              <h2 className="text-2xl font-bold text-base-content">
                {finalTitle}
              </h2>
            ) : null}

            {finalBody ? (
              <StructuredText
                text={finalBody}
                className="mx-auto mt-3 max-w-2xl text-base text-base-content/70"
                paragraphClassName="leading-7 whitespace-pre-line"
                listClassName="list-disc space-y-1 pl-5 text-base-content/70 text-left"
              />
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
}
