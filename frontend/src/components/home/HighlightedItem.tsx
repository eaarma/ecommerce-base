import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { ProductDto } from "@/types/product";

import { getBackgroundImageValue } from "./productVisuals";

type HighlightedItemProps = {
  product?: ProductDto | null;
  eyebrow?: string;
  title?: string;
  description?: string;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
});

function formatPrice(price: ProductDto["price"]) {
  return currencyFormatter.format(Number(price));
}

function getStockTone(product: ProductDto) {
  if (product.status === "OUT_OF_STOCK" || product.stockQuantity <= 0) {
    return {
      chipClass: "border-error/20 bg-error/10 text-error",
      label: "Out of stock",
      helper: "Available to revisit later",
    };
  }

  if (product.stockQuantity <= 3) {
    return {
      chipClass: "border-warning/20 bg-warning/10 text-base-content",
      label: `${product.stockQuantity} left`,
      helper: "Low stock right now",
    };
  }

  return {
    chipClass: "border-success/20 bg-success/10 text-success",
    label: `${product.stockQuantity} in stock`,
    helper: "Ready to order",
  };
}

function trimDescription(description: string) {
  return description.length > 165
    ? `${description.slice(0, 162).trimEnd()}...`
    : description;
}

export default function HighlightedItem({
  product,
  title = "Spotlight",
  description,
}: HighlightedItemProps) {
  if (!product) {
    return null;
  }

  const stockTone = getStockTone(product);
  const hasSectionIntro = Boolean(title || description);

  return (
    <section className="flex h-full flex-col gap-4">
      {hasSectionIntro ? (
        <div className="max-w-xl space-y-2">
          {title ? (
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              {title}
            </p>
          ) : null}
          {description ? (
            <p className="text-sm leading-6 text-base-content/68">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      <Link
        href={`/products/${product.id}`}
        className="group block flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <article className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-[32px] border border-base-300  shadow-[0_24px_70px_rgba(15,23,42,0.16)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
          <div className="relative min-h-[350px] overflow-hidden bg-slate-950 sm:min-h-[390px] lg:basis-[62%]">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
              style={{
                backgroundImage: getBackgroundImageValue(product.imageUrl),
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/18 to-slate-950/60" />

            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-5 sm:p-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/92 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-900 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Highlighted item
              </span>

              <span
                className={`badge border px-3 py-3 text-[11px] font-semibold backdrop-blur-sm ${stockTone.chipClass}`}
              >
                {stockTone.label}
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white sm:p-6">
              <div className="min-w-0 max-w-[80%]">
                <h3 className="text-2xl font-semibold leading-tight sm:text-[2rem]">
                  {product.name}
                </h3>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 px-5 py-4 text-base-content sm:px-6 sm:py-5 lg:basis-[38%]">
            <p className="text-sm leading-7 text-base-content/70">
              {trimDescription(product.description)}
            </p>

            <div className="mt-auto flex items-end justify-between gap-4 border-t border-base-300/80 pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/45">
                  Price
                </p>
                <p className="mt-2 text-lg font-semibold text-base-content sm:text-xl">
                  {formatPrice(product.price)}
                </p>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition group-hover:-translate-y-0.5">
                View product
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </article>
      </Link>
    </section>
  );
}
