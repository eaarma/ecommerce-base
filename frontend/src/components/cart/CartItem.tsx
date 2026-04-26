"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";

import type { CartItem as CartLineItem } from "@/store/cartSlice";

type CartItemProps = {
  item: CartLineItem;
  selected: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
  onToggle: () => void;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
});

const formatPrice = (price: number) => currencyFormatter.format(price);

const placeholder = "/images/item_placeholder.jpg";

const getStockBadge = (item: CartLineItem) => {
  if (item.status === "OUT_OF_STOCK" || item.stockQuantity <= 0) {
    return {
      className: "border-error/20 bg-error/10 text-error",
      label: "Out of stock",
    };
  }

  if (item.stockQuantity <= 3) {
    return {
      className: "border-warning/20 bg-warning/10 text-base-content",
      label: `Only ${item.stockQuantity} left`,
    };
  }

  return {
    className: "border-base-300 bg-base-100 text-base-content/75",
    label: `${item.stockQuantity} in stock`,
  };
};

export default function CartItem({
  item,
  selected,
  onDecrease,
  onIncrease,
  onRemove,
  onToggle,
}: CartItemProps) {
  const imageBackground = item.imageUrl
    ? `url(${item.imageUrl}), url(${placeholder})`
    : `url(${placeholder})`;
  const itemTotal = item.price * item.quantity;
  const stockBadge = getStockBadge(item);

  return (
    <article
      className={`rounded-[24px] border bg-base-100 p-4 shadow-sm transition sm:p-5 ${
        selected
          ? "border-primary/25 shadow-[0_14px_40px_rgba(2,132,199,0.08)]"
          : "border-base-300"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-4">
          <label
            htmlFor={`cart-item-${item.productId}`}
            className="flex cursor-pointer items-start pt-1"
          >
            <input
              id={`cart-item-${item.productId}`}
              type="checkbox"
              checked={selected}
              onChange={onToggle}
              className="checkbox checkbox-primary"
              aria-label={`Select ${item.name}`}
            />
          </label>

          <div
            role="img"
            aria-label={item.name}
            className="aspect-[4/3] w-24 shrink-0 rounded-2xl bg-base-200 bg-cover bg-center sm:w-32"
            style={{ backgroundImage: imageBackground }}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <Link
                  href={`/products/${item.productId}`}
                  className="block break-words text-lg font-semibold text-base-content transition hover:text-primary"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-base-content/65">
                  {formatPrice(item.price)} each
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`badge border px-3 py-3 ${
                    selected
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "border-base-300 bg-base-100 text-base-content/65"
                  }`}
                >
                  {selected ? "Selected" : "Not selected"}
                </span>
                <span
                  className={`badge border px-3 py-3 ${stockBadge.className}`}
                >
                  {stockBadge.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:w-64 lg:items-end">
          <div className="flex flex-wrap items-center justify-between gap-3 lg:w-full">
            <div className="join">
              <button
                type="button"
                className="btn btn-outline btn-sm join-item"
                onClick={onDecrease}
                aria-label={`Decrease ${item.name} quantity`}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="join-item flex h-9 min-w-12 items-center justify-center border-y border-base-300 px-3 text-sm font-semibold">
                {item.quantity}
              </span>
              <button
                type="button"
                className="btn btn-outline btn-sm join-item"
                disabled={item.quantity >= item.stockQuantity}
                onClick={onIncrease}
                aria-label={`Increase ${item.name} quantity`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm text-error"
              onClick={onRemove}
              aria-label={`Remove ${item.name} from cart`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-2xl border border-base-300 bg-base-200/50 px-4 py-3 text-right lg:w-full">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
              Line Total
            </p>
            <p className="mt-1 text-lg font-semibold text-base-content">
              {formatPrice(itemTotal)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
