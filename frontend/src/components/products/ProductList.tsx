import ProductItem from "@/components/products/ProductItem";
import { PageResponse, ProductDto } from "@/types/product";

type ProductListProps = {
  pageData?: PageResponse<ProductDto> | null;
  loading?: boolean;
  error?: string | null;
  onPageChange: (page: number) => void;
};

const SKELETON_COUNT = 8;

function buildPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const pages = new Set<number>([0, totalPages - 1, currentPage]);

  if (currentPage - 1 > 0) {
    pages.add(currentPage - 1);
  }

  if (currentPage + 1 < totalPages - 1) {
    pages.add(currentPage + 1);
  }

  const sortedPages = Array.from(pages).sort((a, b) => a - b);
  const result: Array<number | string> = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];

    if (typeof previousPage === "number" && page - previousPage > 1) {
      result.push(`ellipsis-${page}`);
    }

    result.push(page);
  });

  return result;
}

export default function ProductList({
  pageData,
  loading = false,
  error,
  onPageChange,
}: ProductListProps) {
  if (error) {
    return (
      <section className="rounded-[28px] border border-error/30 bg-error/10 p-6 text-sm text-error">
        {error}
      </section>
    );
  }

  if (loading) {
    return (
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[24px] border border-base-300 bg-white shadow-sm"
          >
            <div className="aspect-[4/3] animate-pulse bg-base-200" />
            <div className="space-y-3 p-5">
              <div className="h-5 w-2/3 animate-pulse rounded bg-base-200" />
              <div className="h-4 w-full animate-pulse rounded bg-base-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-base-200" />
              <div className="h-10 w-full animate-pulse rounded bg-base-200" />
            </div>
          </div>
        ))}
      </section>
    );
  }

  const products = pageData?.content ?? [];

  if (products.length === 0) {
    return (
      <section className="rounded-[28px] border border-base-300 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-base-content">
          No products matched these filters
        </h2>
        <p className="mt-3 text-sm leading-6 text-base-content/65">
          Try a different sort order or clear one of the filters to broaden the
          catalog.
        </p>
      </section>
    );
  }

  const paginationItems = buildPageItems(pageData?.number ?? 0, pageData?.totalPages ?? 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </div>

      {pageData && pageData.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onPageChange(pageData.number - 1)}
            disabled={pageData.first}
            className="btn btn-outline btn-sm rounded-full px-4"
          >
            Prev
          </button>

          {paginationItems.map((item) =>
            typeof item === "number" ? (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={`btn btn-sm rounded-full min-w-[2.5rem] ${
                  item === pageData.number
                    ? "btn-primary"
                    : "btn-outline hover:border-primary/40 hover:text-primary"
                }`}
              >
                {item + 1}
              </button>
            ) : (
              <span
                key={item}
                className="px-2 text-sm font-medium text-base-content/45"
              >
                ...
              </span>
            ),
          )}

          <button
            type="button"
            onClick={() => onPageChange(pageData.number + 1)}
            disabled={pageData.last}
            className="btn btn-outline btn-sm rounded-full px-4"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
