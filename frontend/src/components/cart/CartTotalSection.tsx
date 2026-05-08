"use client";

import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

import { useCartAvailabilitySync } from "@/hooks/useCartAvailabilitySync";
import { isPurchasableCartItem } from "@/store/cartSlice";
import type { RootState } from "@/store/store";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
});

const formatPrice = (price: number) => currencyFormatter.format(price);

export default function CartTotalSection() {
  const router = useRouter();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const { blockingItemCount, isSyncing, syncError } = useCartAvailabilitySync();
  const selectedItems = cartItems.filter(
    (item) => item.selected !== false && isPurchasableCartItem(item),
  );
  const selectedLineCount = selectedItems.length;
  const itemCount = selectedItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const subtotal = selectedItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const handleCheckout = () => {
    router.push("/checkout");
  };

  return (
    <aside className="h-fit lg:sticky lg:top-8">
      <section className="space-y-6 rounded-[24px] border border-base-300 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-content">
            2
          </span>
          <div>
            <h2 className="text-lg font-semibold text-base-content">
              Checkout Summary
            </h2>
            <p className="text-sm text-base-content/60">
              Only selected items will continue to checkout.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
              Selected
            </p>
            <p className="mt-2 text-2xl font-semibold text-base-content">
              {selectedLineCount}
            </p>
            <p className="mt-1 text-sm text-base-content/60">line items</p>
          </div>

          <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-base-content/50">
              Quantity
            </p>
            <p className="mt-2 text-2xl font-semibold text-base-content">
              {itemCount}
            </p>
            <p className="mt-1 text-sm text-base-content/60">units total</p>
          </div>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
          <div className="space-y-3 text-sm text-base-content/70">
            <div className="flex justify-between">
              <span>Items</span>
              <span>{itemCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-base-content/55">Calculated later</span>
            </div>
            <div className="flex justify-between border-t border-base-300 pt-3 text-lg font-semibold text-base-content">
              <span>Estimated Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="btn btn-primary h-12 w-full text-base"
            disabled={itemCount === 0 || isSyncing}
            onClick={handleCheckout}
          >
            {isSyncing ? "Checking cart..." : "Continue to Checkout"}
          </button>

          <button
            type="button"
            className="btn btn-outline h-12 w-full text-base"
            onClick={() => router.push("/")}
          >
            Continue Shopping
          </button>
        </div>

        {(blockingItemCount > 0 || syncError) && (
          <div className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm leading-6 text-base-content/75">
            {syncError
              ? syncError
              : `${blockingItemCount} cart ${
                  blockingItemCount === 1 ? "item needs" : "items need"
                } review before checkout.`}
          </div>
        )}
      </section>
    </aside>
  );
}
