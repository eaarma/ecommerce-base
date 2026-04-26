import { notFound } from "next/navigation";
import { CircleAlert, Package2, ShieldCheck, Sparkles } from "lucide-react";

import BackButton from "@/components/common/BackButton";
import ProductActions from "@/components/products/ProductActions";
import ProductImageGallery from "@/components/products/ProductImageGallery";
import { ProductService } from "@/lib/productService";
import { ProductDto } from "@/types/product";

type ProductPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
});

const formatPrice = (price: ProductDto["price"]) =>
  currencyFormatter.format(Number(price));

const formatStatus = (status: ProductDto["status"]) =>
  status.replace(/_/g, " ").toLowerCase();

const getInventoryMeta = (product: ProductDto) => {
  if (product.status === "OUT_OF_STOCK" || product.stockQuantity <= 0) {
    return {
      tone: "border-error/20 bg-error/10 text-error",
      label: "Out of stock",
      helper: "This item cannot be added to cart right now.",
    };
  }

  if (product.stockQuantity <= 3) {
    return {
      tone: "border-warning/20 bg-warning/10 text-base-content",
      label: `${product.stockQuantity} left`,
      helper: "Low stock. This item may sell out soon.",
    };
  }

  return {
    tone: "border-success/20 bg-success/10 text-success",
    label: `${product.stockQuantity} in stock`,
    helper: "Available and ready to order.",
  };
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const id = Number(productId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  let product: ProductDto;

  try {
    product = await ProductService.getProductById(id);
  } catch {
    notFound();
  }

  const inStock =
    product.stockQuantity > 0 && product.status !== "OUT_OF_STOCK";
  const inventoryMeta = getInventoryMeta(product);

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5">
          <BackButton fallbackUrl="/" label="Back to Products" className="!mb-0" />
        </div>

        <div className="overflow-hidden rounded-[28px] border border-base-300 bg-base-100 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
         

          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <section className="space-y-6">
              <div className="overflow-hidden rounded-[24px] border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5">
                <ProductImageGallery
                  images={product.imageUrl ? [product.imageUrl] : []}
                  title={product.name}
                />
              </div>

             

              
            </section>

            <aside className="h-fit lg:sticky lg:top-8">
              <div className="space-y-6 p-6 ">
              

               
                  <h2 className="break-words text-3xl font-bold leading-tight text-base-content">
                    {product.name}
                  </h2>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`badge border px-4 py-3 font-medium ${inventoryMeta.tone}`}
                    >
                      {inventoryMeta.label}
                    </span>
                  
                  </div>

    

                <div className="rounded-[24px] border border-base-300 bg-base-100 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/45">
                    Description
                  </p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-base-content/75">
                    {product.description || "No description available."}
                  </p>
                </div>

                {!inStock && (
                  <div className="rounded-[24px] border border-error/20 bg-error/5 p-4 text-sm leading-6 text-base-content/75">
                    <div className="flex items-start gap-3">
                      <CircleAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-error" />
                      <p>
                        This product is currently unavailable, so checkout
                        actions are disabled until stock is updated.
                      </p>
                    </div>
                  </div>
                )}

                <div className="rounded-[24px] border border-primary/15 bg-base-100 p-5">
                  <div className="border-b border-base-300 pb-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/45">
                      Price
                    </p>
                    <p className="mt-2 text-3xl font-bold text-base-content">
                      {formatPrice(product.price)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-base-content/65">
                      Final shipping cost is calculated during checkout based on
                      the delivery choice.
                    </p>
                  </div>

                  <div className="pt-5">
                  <ProductActions product={product} disabled={!inStock} />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
