"use client";

import { CreditCard, Minus, Plus, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import { addToCart, createCartLineId } from "@/store/cartSlice";
import type { AppDispatch, RootState } from "@/store/store";
import type { ProductDto, ProductVariantDto } from "@/types/product";

type ProductActionsProps = {
  product: Pick<ProductDto, "id" | "name" | "imageUrl">;
  selectedVariant: Pick<
    ProductVariantDto,
    | "id"
    | "label"
    | "sku"
    | "price"
    | "imageUrl"
    | "stockQuantity"
    | "status"
  >;
  disabled?: boolean;
};

export default function ProductActions({
  product,
  selectedVariant,
  disabled = false,
}: ProductActionsProps) {
  const dispatch = useDispatch<AppDispatch>();
  const lineId = createCartLineId(product.id, selectedVariant.id);
  const cartItem = useSelector((state: RootState) =>
    state.cart.items.find((item) => item.lineId === lineId),
  );
  const router = useRouter();
  const maxQuantity = Math.max(0, selectedVariant.stockQuantity);
  const cartQuantity = cartItem?.quantity ?? 0;
  const remainingQuantity = Math.max(0, maxQuantity - cartQuantity);
  const quantityLimit = remainingQuantity > 0 ? remainingQuantity : 1;
  const [quantity, setQuantity] = useState(1);
  const effectiveQuantity = Math.min(quantity, quantityLimit);

  const decreaseQuantity = () => {
    setQuantity(Math.max(1, effectiveQuantity - 1));
  };

  const increaseQuantity = () => {
    setQuantity(Math.min(quantityLimit, effectiveQuantity + 1));
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

    const quantityToAdd = Math.min(effectiveQuantity, remainingQuantity);

    dispatch(
      addToCart({
        productId: product.id,
        variantId: selectedVariant.id,
        name: product.name,
        variantLabel: selectedVariant.label,
        variantSku: selectedVariant.sku,
        price: Number(selectedVariant.price),
        imageUrl: selectedVariant.imageUrl ?? product.imageUrl,
        stockQuantity: selectedVariant.stockQuantity,
        quantity: quantityToAdd,
        status: selectedVariant.status,
      }),
    );

    return quantityToAdd;
  };

  const handleAddToCart = () => {
    const addedQuantity = addProductToCart();

    if (addedQuantity > 0) {
      const lineTitle =
        selectedVariant.label === "Default"
          ? product.name
          : `${product.name} (${selectedVariant.label})`;
      toast.success(`Added ${addedQuantity} ${lineTitle} to cart`);
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
            value={effectiveQuantity}
            disabled={disabled}
            onChange={(event) => updateQuantity(event.target.value)}
            className="input input-bordered join-item w-20 text-center"
          />
          <button
            type="button"
            className="btn btn-outline join-item"
            disabled={disabled || effectiveQuantity >= quantityLimit}
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
