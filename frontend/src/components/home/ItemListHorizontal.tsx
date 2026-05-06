"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductDto } from "@/types/product";

import FeaturedProductCard from "./FeaturedProductCard";

interface ItemListHorizontalProps {
  title: string;
  products: ProductDto[];
}

export default function ItemListHorizontal({
  title,
  products,
}: ItemListHorizontalProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncScrollState = useCallback(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      setHasOverflow(false);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const maxScrollLeft = Math.max(
      container.scrollWidth - container.clientWidth,
      0,
    );
    const nextHasOverflow = maxScrollLeft > 4;

    setHasOverflow(nextHasOverflow);
    setCanScrollLeft(nextHasOverflow && container.scrollLeft > 4);
    setCanScrollRight(
      nextHasOverflow && container.scrollLeft < maxScrollLeft - 4,
    );
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    syncScrollState();

    const handleScroll = () => {
      syncScrollState();
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", syncScrollState);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            syncScrollState();
          })
        : null;

    resizeObserver?.observe(container);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", syncScrollState);
      resizeObserver?.disconnect();
    };
  }, [products, syncScrollState]);

  const scrollRow = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    const scrollAmount = Math.max(container.clientWidth * 0.85, 320);

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-6">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
          {title}
        </p>
      </div>

      {products.length > 0 ? (
        <div className="relative">
          {hasOverflow ? (
            <>
              {canScrollLeft ? (
                <button
                  type="button"
                  className="btn btn-circle btn-outline btn-sm absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-base-100/92 shadow-sm backdrop-blur-sm"
                  onClick={() => scrollRow("left")}
                  aria-label={`Scroll ${title} left`}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : null}
              {canScrollRight ? (
                <button
                  type="button"
                  className="btn btn-circle btn-outline btn-sm absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-base-100/92 shadow-sm backdrop-blur-sm"
                  onClick={() => scrollRow("right")}
                  aria-label={`Scroll ${title} right`}
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : null}
            </>
          ) : null}

          <div
            ref={scrollContainerRef}
            className="overflow-x-auto px-10 pb-4 [scrollbar-width:thin] sm:px-12"
          >
            <div className="flex gap-5 snap-x snap-mandatory">
              {products.map((product) => (
                <FeaturedProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>

          {canScrollLeft ? (
            <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-base-100 via-base-100/75 to-transparent sm:w-4" />
          ) : null}
          {canScrollRight ? (
            <div className="pointer-events-none absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-base-100 via-base-100/75 to-transparent sm:w-4" />
          ) : null}
        </div>
      ) : (
        <div className="rounded-[28px] border border-base-300 bg-white px-6 py-10 text-center shadow-sm">
          <h3 className="text-xl font-semibold text-base-content">
            Products will show up here soon
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-base-content/65">
            Once the catalog is available, this row becomes a quick horizontal
            browse of the store&apos;s most compelling picks.
          </p>
          <Link
            href="/products"
            className="btn btn-primary mt-6 rounded-full px-6"
          >
            View products
          </Link>
        </div>
      )}
    </section>
  );
}
