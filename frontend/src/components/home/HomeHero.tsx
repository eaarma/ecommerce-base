import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Store, Truck } from "lucide-react";

import { ProductDto } from "@/types/product";

import { getBackgroundImageValue } from "./productVisuals";

type HomeHeroProps = {
  product?: ProductDto | null;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
});

function formatPrice(price: number | null | undefined) {
  if (typeof price !== "number") {
    return "Curated selection";
  }

  return currencyFormatter.format(price);
}

function trimDescription(description: string | null | undefined) {
  if (!description) {
    return "Built around a smaller catalog that is easier to browse, easier to trust, and easier to enjoy.";
  }

  return description.length > 145
    ? `${description.slice(0, 142).trimEnd()}...`
    : description;
}

export default function HomeHero({ product }: HomeHeroProps) {
  return (
    <section className="relative pb-12 sm:pb-16">
      <div className="relative overflow-hidden rounded-[34px] border border-primary/12 bg-gradient-to-br from-primary/10 via-base-100 to-accent/10 shadow-[0_28px_80px_rgba(15,23,42,0.12)]">
        <div className="absolute -left-14 top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-10 top-10 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-6 left-1/3 h-28 w-28 rounded-full bg-secondary/10 blur-2xl" />

        <div className="relative grid gap-10 px-6 py-10 sm:px-8 sm:py-12 lg:grid-cols-[1.06fr_0.94fr] lg:px-12 lg:py-14">
          <div className="flex flex-col justify-center gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-base-300/70 bg-base-100/85 px-4 py-2 text-sm font-semibold text-base-content shadow-sm backdrop-blur-sm">
              <Store className="h-4 w-4 text-primary" />
              Thoughtfully chosen everyday goods
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                Ecommerce Store
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-base-content sm:text-5xl lg:text-6xl">
                A warmer, easier storefront for products worth bringing home
              </h1>
              <p className="max-w-xl text-base leading-7 text-base-content/70 sm:text-lg">
                Browse a curated catalog with clear stock visibility, dependable
                product pages, and a calm path from discovery to checkout.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="btn btn-primary rounded-full border-0 px-6 text-base shadow-[0_14px_35px_rgba(2,132,199,0.28)] transition hover:-translate-y-0.5"
              >
                Shop products
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="btn rounded-full border border-base-300 bg-base-100 px-6 text-base text-base-content shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
              >
                About us
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-base-300/70 bg-base-100/82 p-4 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold text-base-content">
                  Curated catalog
                </p>
                <p className="mt-1 text-sm leading-6 text-base-content/65">
                  Smaller, cleaner selections that are easy to browse.
                </p>
              </div>
              <div className="rounded-[24px] border border-base-300/70 bg-base-100/82 p-4 shadow-sm backdrop-blur-sm">
                <ShieldCheck className="h-5 w-5 text-secondary" />
                <p className="mt-3 text-sm font-semibold text-base-content">
                  Reliable details
                </p>
                <p className="mt-1 text-sm leading-6 text-base-content/65">
                  Clear stock and product information at every step.
                </p>
              </div>
              <div className="rounded-[24px] border border-base-300/70 bg-base-100/82 p-4 shadow-sm backdrop-blur-sm">
                <Truck className="h-5 w-5 text-accent" />
                <p className="mt-3 text-sm font-semibold text-base-content">
                  Smooth checkout
                </p>
                <p className="mt-1 text-sm leading-6 text-base-content/65">
                  A direct journey from inspiration to completed order.
                </p>
              </div>
            </div>
          </div>

          <div className="relative min-h-[360px] lg:min-h-[470px]">
            <div className="absolute left-0 top-6 hidden w-44 rounded-[24px] border border-base-300/70 bg-base-100/85 p-4 shadow-lg backdrop-blur-sm md:block">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Store promise
              </p>
              <p className="mt-2 text-sm leading-6 text-base-content/70">
                Beautiful basics, honest availability, and a homepage designed
                to feel polished instead of crowded.
              </p>
            </div>

            <div className="relative ml-auto h-full max-w-[430px] overflow-hidden rounded-[30px] border border-base-300/40 bg-neutral shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
              <div
                aria-hidden="true"
                className="h-full min-h-[360px] bg-cover bg-center"
                style={{ backgroundImage: getBackgroundImageValue(product?.imageUrl) }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral via-neutral/55 to-base-100/10" />

              <div className="absolute inset-x-0 top-0 p-5">
                <span className="inline-flex rounded-full bg-base-100/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-base-content shadow-sm backdrop-blur-sm">
                  {product && product.stockQuantity > 0
                    ? "Featured and in stock"
                    : "Store spotlight"}
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 text-neutral-content">
                <p className="text-sm uppercase tracking-[0.28em] text-neutral-content/70">
                  Hero product
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {product?.name ?? "A calmer way to discover the catalog"}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-content/80">
                  {trimDescription(product?.description)}
                </p>

                <div className="mt-5 flex items-center justify-between gap-4 rounded-[22px] border border-neutral-content/15 bg-base-100/12 px-4 py-3 shadow-sm backdrop-blur-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-content/60">
                      From
                    </p>
                    <p className="mt-1 text-xl font-semibold text-neutral-content">
                      {formatPrice(product?.price)}
                    </p>
                  </div>

                  <Link
                    href={product ? `/products/${product.id}` : "/products"}
                    className="inline-flex items-center gap-2 rounded-full bg-base-100 px-4 py-2 text-sm font-semibold text-base-content transition hover:-translate-y-0.5"
                  >
                    See details
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 right-0 hidden w-48 rounded-[24px] border border-base-300/20 bg-neutral px-5 py-4 text-neutral-content shadow-xl lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-content/60">
                Featured now
              </p>
              <p className="mt-2 text-lg font-semibold leading-snug">
                {product?.name ?? "Our latest catalog picks"}
              </p>
              <p className="mt-1 text-sm text-neutral-content/75">
                {product && product.stockQuantity > 0
                  ? `${product.stockQuantity} currently available`
                  : "Browse the full range on the Products page"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex justify-center translate-y-1/2">
        <Link
          href="/products"
          className="btn btn-accent btn-lg rounded-full border-0 px-8 text-base font-semibold shadow-[0_18px_40px_rgba(245,158,11,0.28)] transition hover:-translate-y-0.5"
        >
          View products
        </Link>
      </div>
    </section>
  );
}
