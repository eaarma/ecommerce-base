"use client";

import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

import type { RootState } from "@/store/store";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatPrice = (price: number) => currencyFormatter.format(price);

export default function CartTotalSection() {
  const router = useRouter();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const selectedItems = cartItems.filter((item) => item.selected !== false);
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
    <aside className="w-full rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm md:w-1/3 sm:mt-12">
      <h2 className="text-xl font-semibold text-base-content">Summary</h2>

      <div className="mt-5 space-y-3 text-sm text-base-content/70">
        <div className="flex justify-between">
          <span>Items</span>
          <span>{itemCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between border-t border-base-300 pt-3 font-semibold text-base-content">
          <span>Total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary mt-6 w-full"
        disabled={itemCount === 0}
        onClick={handleCheckout}
      >
        Checkout
      </button>
    </aside>
  );
}
