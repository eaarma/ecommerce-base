"use client";

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
  currency: "USD",
});

const formatPrice = (price: number) => currencyFormatter.format(price);

const placeholder = "/images/item_placeholder.jpg";

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

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm sm:flex-row sm:items-center">
      <label
        htmlFor={`cart-item-${item.productId}`}
        className="flex cursor-pointer items-center gap-2 sm:self-center"
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
        className="aspect-[4/3] w-full shrink-0 rounded-lg bg-base-200 bg-cover bg-center sm:w-28"
        style={{ backgroundImage: imageBackground }}
      />

      <div className="min-w-0 flex-1">
        <h2 className="break-words text-base font-semibold text-base-content">
          {item.name}
        </h2>
        <p className="mt-1 text-sm text-base-content/65">
          {formatPrice(item.price)} each
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        <div className="join">
          <button
            type="button"
            className="btn btn-outline btn-sm join-item"
            onClick={onDecrease}
            aria-label={`Decrease ${item.name} quantity`}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="join-item flex h-8 min-w-12 items-center justify-center border-y border-base-300 px-3 text-sm font-semibold">
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

        <p className="min-w-20 text-right font-semibold text-base-content">
          {formatPrice(itemTotal)}
        </p>

        <button
          type="button"
          className="btn btn-ghost btn-sm text-error"
          onClick={onRemove}
          aria-label={`Remove ${item.name} from cart`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
