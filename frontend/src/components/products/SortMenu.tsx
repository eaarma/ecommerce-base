"use client";

import { ArrowDownUp } from "lucide-react";

import { ProductSortKey } from "@/types/product";

export const DEFAULT_PRODUCT_SORT: ProductSortKey = "updatedAt,desc";

export const PRODUCT_SORT_OPTIONS: Array<{
  key: ProductSortKey;
  label: string;
}> = [
  { key: "updatedAt,desc", label: "Newest first" },
  { key: "name,asc", label: "Name A-Z" },
  { key: "name,desc", label: "Name Z-A" },
  { key: "price,asc", label: "Price low to high" },
  { key: "price,desc", label: "Price high to low" },
  { key: "stockQuantity,desc", label: "Most in stock" },
];

interface SortMenuProps {
  sortKey: string;
  onSortChange: (newSortKey: ProductSortKey) => void;
}

export default function SortMenu({ sortKey, onSortChange }: SortMenuProps) {
  return (
    <section className="w-full sm:w-auto">
      <label
        htmlFor="product-sort"
        className="mb-2 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-base-content/60"
      >
        <ArrowDownUp className="h-4 w-4 text-primary" />
        Sort
      </label>

      <select
        id="product-sort"
        value={sortKey}
        onChange={(event) => onSortChange(event.target.value as ProductSortKey)}
        className="select select-bordered w-full min-w-[220px] rounded-2xl border-base-300  shadow-sm focus:border-primary"
      >
        {PRODUCT_SORT_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </section>
  );
}
