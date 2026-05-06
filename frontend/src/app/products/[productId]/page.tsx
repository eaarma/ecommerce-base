import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BackButton from "@/components/common/BackButton";
import ProductDetailView from "@/components/products/ProductDetailView";
import { ProductService } from "@/lib/productService";
import { getPublicShopOrFallback } from "@/lib/shopService";
import { buildStoreMetadata } from "@/lib/storeSeo";
import { ProductDto } from "@/types/product";

type ProductPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const id = Number(productId);
  const shop = await getPublicShopOrFallback();

  if (!Number.isInteger(id) || id <= 0) {
    return buildStoreMetadata({
      shop,
      pageTitle: "Product",
      fallbackDescription: shop.shortDescription,
    });
  }

  try {
    const product = await ProductService.getProductById(id);

    return buildStoreMetadata({
      shop,
      pageTitle: product.name,
      description: product.description,
      fallbackDescription: shop.shortDescription,
      ogImageUrl: product.mainImageUrl ?? product.imageUrl,
    });
  } catch {
    return buildStoreMetadata({
      shop,
      pageTitle: "Product",
      fallbackDescription: shop.shortDescription,
    });
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const id = Number(productId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  let product: ProductDto;

  try {
    product = await ProductService.getProductById(id);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 404
    ) {
      notFound();
    }

    throw error;
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5">
          <BackButton fallbackUrl="/" label="Back to Products" className="!mb-0" />
        </div>

        <ProductDetailView key={product.id} product={product} />
      </div>
    </main>
  );
}
