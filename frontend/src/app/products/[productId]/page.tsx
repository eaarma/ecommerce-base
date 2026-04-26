import { notFound } from "next/navigation";

import BackButton from "@/components/common/BackButton";
import ProductActions from "@/components/products/ProductActions";
import { ProductService } from "@/lib/productService";
import { ProductDto } from "@/types/product";
import ProductImageGallery from "@/components/products/ProductImageGallery";

type ProductPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatPrice = (price: ProductDto["price"]) =>
  currencyFormatter.format(Number(price));

const formatStatus = (status: ProductDto["status"]) =>
  status.replace(/_/g, " ").toLowerCase();

const statusBadgeClass = (status: ProductDto["status"]) => {
  switch (status) {
    case "ACTIVE":
      return "badge-success";
    case "OUT_OF_STOCK":
      return "badge-warning";
    case "ARCHIVED":
      return "badge-neutral";
    case "DRAFT":
    default:
      return "badge-outline";
  }
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

  return (
    <div className="min-h-screen bg-base-100 py-6 md:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4">
          <BackButton fallbackUrl="/" label="Back" className="!mb-0" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
          <div className="flex flex-col lg:flex-row">
            <div className="relative m-4 sm:m-6 lg:w-1/2 shrink-0">
              <ProductImageGallery
                images={product.imageUrl ? [product.imageUrl] : []}
                title={product.name}
              />

              <div
                className={[
                  "absolute top-4 right-4 z-10 badge capitalize border",
                  statusBadgeClass(product.status),
                ].join(" ")}
              >
                {formatStatus(product.status)}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-5 p-6 lg:p-8 min-w-0">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-base-content break-words">
                  {product.name}
                </h1>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-3xl font-bold text-primary">
                    {formatPrice(product.price)}
                  </span>

                  <span
                    className={`badge ${inStock ? "badge-success" : "badge-neutral"}`}
                  >
                    {inStock
                      ? `${product.stockQuantity} in stock`
                      : "Out of stock"}
                  </span>
                </div>
              </div>

              <div className="h-px bg-base-300" />

              <div>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70">
                  Description
                </h2>
                <p className="whitespace-pre-line text-sm leading-7 text-base-content/75">
                  {product.description || "No description available."}
                </p>
              </div>

              <div className="h-px bg-base-300" />

              <ProductActions product={product} disabled={!inStock} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
