import type { Metadata } from "next";
import StorePolicyPage from "@/components/store-pages/StorePolicyPage";
import { getPublicShopOrFallback } from "@/lib/shopService";
import { buildStoreMetadata } from "@/lib/storeSeo";
import { getPublicStorePageOrFallback } from "@/lib/storePageService";

export async function generateMetadata(): Promise<Metadata> {
  const [shop, termsPage] = await Promise.all([
    getPublicShopOrFallback(),
    getPublicStorePageOrFallback("terms"),
  ]);

  return buildStoreMetadata({
    shop,
    pageTitle: termsPage.title,
    description: termsPage.description,
    fallbackDescription: shop.shortDescription,
  });
}

export default async function TermsOfServicePage() {
  const termsPage = await getPublicStorePageOrFallback("terms");

  return (
    <StorePolicyPage
      eyebrow="Legal"
      title={termsPage.title}
      description={termsPage.description}
      content={termsPage.contentJson}
      closingNote={termsPage.closingNote}
    />
  );
}
