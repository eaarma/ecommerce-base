"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import FilterMenu, {
  ProductFilterGroup,
} from "@/components/products/FilterMenu";
import ProductList from "@/components/products/ProductList";
import SortMenu, {
  DEFAULT_PRODUCT_SORT,
} from "@/components/products/SortMenu";
import { ProductService } from "@/lib/productService";
import {
  PageResponse,
  ProductAvailability,
  ProductDto,
  ProductPriceRange,
  ProductSortKey,
} from "@/types/product";

const PAGE_SIZE = 12;

const PRODUCT_FILTERS: ProductFilterGroup[] = [
  {
    key: "availability",
    label: "Availability",
    options: [
      { label: "In stock", value: "IN_STOCK" },
      { label: "Out of stock", value: "OUT_OF_STOCK" },
    ],
  },
  {
    key: "priceRange",
    label: "Price range",
    options: [
      { label: "Under EUR 25", value: "UNDER_25" },
      { label: "EUR 25 to EUR 50", value: "BETWEEN_25_AND_50" },
      { label: "EUR 50 to EUR 100", value: "BETWEEN_50_AND_100" },
      { label: "Over EUR 100", value: "OVER_100" },
    ],
  },
];

export default function ProductsPage() {
  const params = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<PageResponse<ProductDto> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const selectedAvailability = params.getAll("availability");
  const selectedPriceRanges = params.getAll("priceRange");
  const sort = params.get("sort") || DEFAULT_PRODUCT_SORT;
  const searchKey = params.toString();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const currentParams = new URLSearchParams(searchKey);
      const currentPage = Number(currentParams.get("page") || 0);
      const currentSort = currentParams.get("sort") || DEFAULT_PRODUCT_SORT;
      const availability = currentParams.getAll("availability");
      const priceRange = currentParams.getAll("priceRange");

      try {
        const data = await ProductService.getProductsPage({
          page: Number.isNaN(currentPage) ? 0 : currentPage,
          size: PAGE_SIZE,
          sort: currentSort,
          availability: availability.length
            ? (availability as ProductAvailability[])
            : undefined,
          priceRange: priceRange.length
            ? (priceRange as ProductPriceRange[])
            : undefined,
        });

        if (!cancelled) {
          setPageData(data);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load products right now.");
          setPageData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [searchKey]);

  const handleFilterChange = (selection: Record<string, string[]>) => {
    const search = new URLSearchParams();

    search.set("page", "0");
    search.set("sort", sort);

    Object.entries(selection).forEach(([key, values]) => {
      values.forEach((value) => search.append(key, value));
    });

    router.replace(`/products?${search.toString()}`);
  };

  const handleSortChange = (newSort: ProductSortKey) => {
    if (newSort === sort) {
      return;
    }

    const search = new URLSearchParams(params.toString());
    search.set("sort", newSort);
    search.set("page", "0");
    router.replace(`/products?${search.toString()}`);
  };

  const handlePageChange = (page: number) => {
    if (page < 0) {
      return;
    }

    const search = new URLSearchParams(params.toString());
    search.set("page", page.toString());
    router.replace(`/products?${search.toString()}`);
  };

  return (
    <div className="min-h-screen bg-base-100 font-sans">
      <main className="mx-auto flex w-full flex-col gap-8 py-10 sm:px-10 lg:px-12">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Ecommerce Store
          </p>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-base-content sm:text-4xl">
              Products
            </h1>
            <p className="max-w-2xl text-base text-base-content/70">
              Browse the full catalog, adjust filters, and move page by page
              through the storefront.
            </p>
          </div>
        </header>

        <section className="grid gap-5 rounded-[28px] border border-base-300 bg-base-100 p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <FilterMenu
            filters={PRODUCT_FILTERS}
            selected={{
              availability: selectedAvailability,
              priceRange: selectedPriceRanges,
            }}
            onChange={handleFilterChange}
          />

          <SortMenu
            sortKey={sort}
            onSortChange={handleSortChange}
          />
        </section>

        <ProductList
          pageData={pageData}
          loading={loading}
          error={error}
          onPageChange={handlePageChange}
        />
      </main>
    </div>
  );
}
