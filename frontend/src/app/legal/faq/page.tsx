import type { Metadata } from "next";
import StoreFaqPage from "@/components/store-pages/StoreFaqPage";
import { getPublicShopOrFallback } from "@/lib/shopService";
import { buildStoreMetadata } from "@/lib/storeSeo";
import { getPublicStorePageOrFallback } from "@/lib/storePageService";

export async function generateMetadata(): Promise<Metadata> {
  const [shop, faqPage] = await Promise.all([
    getPublicShopOrFallback(),
    getPublicStorePageOrFallback("faq"),
  ]);

  return buildStoreMetadata({
    shop,
    pageTitle: faqPage.title,
    description: faqPage.description,
    fallbackDescription: shop.shortDescription,
  });
}

export default async function FAQPage() {
  const faqPage = await getPublicStorePageOrFallback("faq");

  return (
    <StoreFaqPage
      title={faqPage.title}
      description={faqPage.description}
      content={faqPage.contentJson}
      closingNote={faqPage.closingNote}
    />
  );
}
