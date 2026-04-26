import Link from "next/link";
import { ArrowUpRight, Package2 } from "lucide-react";

import { ProductDto } from "@/types/product";

type ProductItemProps = {
  product: ProductDto;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
});

const formatPrice = (price: ProductDto["price"]) =>
  currencyFormatter.format(Number(price));

const getStockTone = (product: ProductDto) => {
  if (product.status === "OUT_OF_STOCK" || product.stockQuantity <= 0) {
    return {
      badgeClass: "border-error/20 bg-error/10 text-error",
      label: "Out of stock",
      helper: "Currently unavailable",
    };
  }

  if (product.stockQuantity <= 3) {
    return {
      badgeClass: "border-warning/20 bg-warning/10 text-base-content",
      label: `${product.stockQuantity} left`,
      helper: "Low stock",
    };
  }

  return {
    badgeClass: "border-success/20 bg-success/10 text-success",
    label: `${product.stockQuantity} in stock`,
    helper: "Ready to ship",
  };
};

const placeholder = "/images/item_placeholder.jpg";

export default function ProductItem({ product }: ProductItemProps) {
  const productImageUrl = product.imageUrl?.trim();
  const isPlaceholder = !productImageUrl;
  const imageBackground = productImageUrl
    ? `url(${productImageUrl}), url(${placeholder})`
    : `url(${placeholder})`;
  const stockTone = getStockTone(product);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`View ${product.name}`}
    >
      <article className="flex h-full flex-col overflow-hidden rounded-[24px] border border-base-300 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-base-200">
          <div
            role="img"
            aria-label={product.name}
            className={`h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-105 ${
              isPlaceholder ? "opacity-75 grayscale-[0.25]" : ""
            }`}
            style={{ backgroundImage: imageBackground }}
          />

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.12)_70%,rgba(15,23,42,0.3)_100%)]" />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
            <span
              className={`badge border px-3 py-3 backdrop-blur-sm ${stockTone.badgeClass}`}
            >
              {stockTone.label}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-base-100/92 px-3 py-2 text-xs font-medium text-base-content shadow-sm backdrop-blur-sm">
              <Package2 className="h-3.5 w-3.5" />
              {stockTone.helper}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5 p-5">
          <div className="space-y-3">
            <div>
              <h2 className="break-words text-xl font-semibold leading-snug text-base-content transition group-hover:text-primary">
                {product.name}
              </h2>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-base-content/65">
                {product.description}
              </p>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between gap-4 border-t border-base-300 pt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/45">
                Price
              </p>
              <p className="mt-1 text-lg font-semibold text-base-content">
                {formatPrice(product.price)}
              </p>
            </div>

            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary transition group-hover:translate-x-0.5">
              View product
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
