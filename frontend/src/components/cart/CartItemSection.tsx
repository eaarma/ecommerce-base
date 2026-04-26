"use client";

import CartItem from "@/components/cart/CartItem";
import {
  decreaseQuantity,
  increaseQuantity,
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
  const selectedCount = cartItems.filter((item) => isSelected(item.selected))
    .length;
  const allSelected =
    cartItems.length > 0 && selectedCount === cartItems.length;

  const handleToggleAll = () => {
    dispatch(setAllCartItemSelection(!allSelected));
  };

  return (
    <section className="w-full space-y-4 md:w-2/3">
      <h1 className="text-2xl font-bold text-base-content">Your Cart</h1>

      {cartItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-base-300 bg-base-100 p-5 text-sm text-base-content/60">
          Your cart is empty.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-base-300 pb-3">
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
              />
              <span className="text-sm font-medium text-base-content/75">
                Select all ({selectedCount})
              </span>
            </label>

            <button
              type="button"
              className="btn btn-outline btn-error btn-sm"
              disabled={selectedCount === 0}
              onClick={() => dispatch(removeSelectedFromCart())}
            >
              Remove ({selectedCount})
            </button>
          </div>

          {cartItems.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              selected={isSelected(item.selected)}
              onDecrease={() => dispatch(decreaseQuantity(item.productId))}
              onIncrease={() => dispatch(increaseQuantity(item.productId))}
              onRemove={() => dispatch(removeFromCart(item.productId))}
              onToggle={() => dispatch(toggleItemSelection(item.productId))}
            />
          ))}
        </div>
      )}
    </section>
  );
}
