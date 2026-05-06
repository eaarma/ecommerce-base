import type { Metadata } from "next";
import StorePolicyPage from "@/components/store-pages/StorePolicyPage";
import { getPublicShopOrFallback } from "@/lib/shopService";
import { buildStoreMetadata } from "@/lib/storeSeo";
import { getPublicStorePageOrFallback } from "@/lib/storePageService";

export async function generateMetadata(): Promise<Metadata> {
  const [shop, shippingPage] = await Promise.all([
    getPublicShopOrFallback(),
    getPublicStorePageOrFallback("shipping"),
  ]);

  return buildStoreMetadata({
    shop,
    pageTitle: shippingPage.title,
    description: shippingPage.description,
    fallbackDescription: shop.shortDescription,
  });
}

export default async function ShippingPolicyPage() {
  const shippingPage = await getPublicStorePageOrFallback("shipping");

  return (
    <StorePolicyPage
      eyebrow="Store policy"
      title={shippingPage.title}
      description={shippingPage.description}
      content={shippingPage.contentJson}
      closingNote={shippingPage.closingNote}
    />
  );
}
