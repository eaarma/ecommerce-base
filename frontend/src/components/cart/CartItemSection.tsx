"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import CartItem from "@/components/cart/CartItem";
import {
  decreaseQuantity,
  increaseQuantity,
  isPurchasableCartItem,
  removeFromCart,
  removeSelectedFromCart,
  setAllCartItemSelection,
  toggleItemSelection,
} from "@/store/cartSlice";
import type { AppDispatch, RootState } from "@/store/store";
import { useDispatch, useSelector } from "react-redux";

const isSelected = (selected?: boolean) => selected !== false;

export default function CartItemSection() {
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const selectedCount = cartItems.filter((item) => isSelected(item.selected)).length;
  const selectableItems = cartItems.filter(isPurchasableCartItem);
  const selectedSelectableCount = selectableItems.filter((item) =>
    isSelected(item.selected),
  ).length;
  const allSelected =
    selectableItems.length > 0 && selectedSelectableCount === selectableItems.length;

  const handleToggleAll = () => {
    dispatch(setAllCartItemSelection(!allSelected));
  };

  return (
    <section className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-content">
          1
        </span>
        <div>
          <h2 className="text-lg font-semibold text-base-content">
            Cart Items
          </h2>
          <p className="text-sm text-base-content/60">
            Select the products you want to keep in this checkout flow.
          </p>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-base-300 bg-base-100 px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-base-200 text-base-content/70">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-base-content">
            Your cart is empty
          </h3>
          <p className="mt-2 text-sm leading-6 text-base-content/60">
            Add a few products first, then come back here to review your order.
          </p>
          <div className="mt-6">
            <Link href="/" className="btn btn-primary h-12 px-6 text-base">
              Continue Shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-[24px] border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <label
                  htmlFor="cart-toggle-all"
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    id="cart-toggle-all"
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleToggleAll}
                    className="checkbox checkbox-primary"
                    disabled={selectableItems.length === 0}
                  />
                  <span className="text-sm font-medium text-base-content/80">
                    Select all items
                  </span>
                </label>
                <p className="mt-2 text-sm text-base-content/60">
                  {selectedCount} of {cartItems.length} line items selected for
                  checkout.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-error h-11 px-4"
                disabled={selectedCount === 0}
                onClick={() => dispatch(removeSelectedFromCart())}
              >
                Remove Selected
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {cartItems.map((item) => (
              <CartItem
                key={item.lineId}
                item={item}
                selected={isSelected(item.selected)}
                onDecrease={() => dispatch(decreaseQuantity(item.lineId))}
                onIncrease={() => dispatch(increaseQuantity(item.lineId))}
                onRemove={() => dispatch(removeFromCart(item.lineId))}
                onToggle={() => dispatch(toggleItemSelection(item.lineId))}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
