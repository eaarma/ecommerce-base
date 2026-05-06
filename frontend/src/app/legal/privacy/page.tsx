import type { Metadata } from "next";
import StorePolicyPage from "@/components/store-pages/StorePolicyPage";
import { getPublicShopOrFallback } from "@/lib/shopService";
import { buildStoreMetadata } from "@/lib/storeSeo";
import { getPublicStorePageOrFallback } from "@/lib/storePageService";

export async function generateMetadata(): Promise<Metadata> {
  const [shop, privacyPage] = await Promise.all([
    getPublicShopOrFallback(),
    getPublicStorePageOrFallback("privacy"),
  ]);

  return buildStoreMetadata({
    shop,
    pageTitle: privacyPage.title,
    description: privacyPage.description,
    fallbackDescription: shop.shortDescription,
  });
}

export default async function PrivacyPolicyPage() {
  const privacyPage = await getPublicStorePageOrFallback("privacy");

  return (
    <StorePolicyPage
      eyebrow="Legal"
      title={privacyPage.title}
      description={privacyPage.description}
      content={privacyPage.contentJson}
      closingNote={privacyPage.closingNote}
    />
  );
}
