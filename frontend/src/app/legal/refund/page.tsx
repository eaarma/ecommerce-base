import type { Metadata } from "next";
import StorePolicyPage from "@/components/store-pages/StorePolicyPage";
import { getPublicShopOrFallback } from "@/lib/shopService";
import { buildStoreMetadata } from "@/lib/storeSeo";
import { getPublicStorePageOrFallback } from "@/lib/storePageService";

export async function generateMetadata(): Promise<Metadata> {
  const [shop, refundPage] = await Promise.all([
    getPublicShopOrFallback(),
    getPublicStorePageOrFallback("cancellation-refund"),
  ]);

  return buildStoreMetadata({
    shop,
    pageTitle: refundPage.title,
    description: refundPage.description,
    fallbackDescription: shop.shortDescription,
  });
}

export default async function CancellationRefundPolicyPage() {
  const refundPage = await getPublicStorePageOrFallback("cancellation-refund");

  return (
    <StorePolicyPage
      eyebrow="Store policy"
      title={refundPage.title}
      description={refundPage.description}
      content={refundPage.contentJson}
      closingNote={refundPage.closingNote}
    />
  );
}
