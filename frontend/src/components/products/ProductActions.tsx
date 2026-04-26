"use client";

import { CreditCard, Minus, Plus, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import { addToCart } from "@/store/cartSlice";
import type { AppDispatch, RootState } from "@/store/store";
import type { ProductDto } from "@/types/product";

type ProductActionsProps = {
  product: Pick<
    ProductDto,
    "id" | "name" | "price" | "imageUrl" | "stockQuantity" | "status"
  >;
  disabled?: boolean;
};

export default function ProductActions({
  product,
  disabled = false,
}: ProductActionsProps) {
  const dispatch = useDispatch<AppDispatch>();
  const cartItem = useSelector((state: RootState) =>
    state.cart.items.find((item) => item.productId === product.id),
  );
  const router = useRouter();
  const maxQuantity = Math.max(0, product.stockQuantity);
  const cartQuantity = cartItem?.quantity ?? 0;
  const remainingQuantity = Math.max(0, maxQuantity - cartQuantity);
  const quantityLimit = remainingQuantity > 0 ? remainingQuantity : 1;
  const [quantity, setQuantity] = useState(1);

  const decreaseQuantity = () => {
    setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1));
  };

  const increaseQuantity = () => {
    setQuantity((currentQuantity) =>
      Math.min(quantityLimit, currentQuantity + 1),
    );
  };

  const updateQuantity = (value: string) => {
    const nextQuantity = Number(value);

    if (!Number.isInteger(nextQuantity)) return;

    setQuantity(Math.min(Math.max(nextQuantity, 1), quantityLimit));
  };

  const addProductToCart = () => {
    if (disabled) return 0;

    if (remainingQuantity <= 0) {
      toast.error(
        `${cartQuantity} ${cartQuantity === 1 ? "piece" : "pieces"} in cart, no more available`,
      );
      return 0;
    }

    const quantityToAdd = Math.min(quantity, remainingQuantity);

    dispatch(
      addToCart({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        imageUrl: product.imageUrl,
        stockQuantity: product.stockQuantity,
        quantity: quantityToAdd,
        status: product.status,
      }),
    );

    return quantityToAdd;
  };

  const handleAddToCart = () => {
    const addedQuantity = addProductToCart();

    if (addedQuantity > 0) {
      toast.success(`Added ${addedQuantity} ${product.name} to cart`);
    }
  };

  const handleBuyNow = () => {
    const addedQuantity = addProductToCart();

    if (addedQuantity > 0) {
      router.push("/cart");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="product-quantity"
          className="text-sm font-semibold text-base-content/70"
        >
          Quantity
        </label>
        <div className="join w-full max-w-48">
          <button
            type="button"
            className="btn btn-outline join-item"
            disabled={disabled || quantity <= 1}
            onClick={decreaseQuantity}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            id="product-quantity"
            type="number"
            min={1}
            max={quantityLimit}
            value={quantity}
            disabled={disabled}
            onChange={(event) => updateQuantity(event.target.value)}
            className="input input-bordered join-item w-20 text-center"
          />
          <button
            type="button"
            className="btn btn-outline join-item"
            disabled={disabled || quantity >= quantityLimit}
            onClick={increaseQuantity}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          className="btn btn-primary w-full"
          disabled={disabled}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-5 w-5" />
          Add to cart
        </button>
        <button
          type="button"
          className="btn btn-outline btn-primary w-full"
          disabled={disabled}
          onClick={handleBuyNow}
        >
          <CreditCard className="h-5 w-5" />
          Buy now
        </button>
      </div>
    </div>
  );
}
