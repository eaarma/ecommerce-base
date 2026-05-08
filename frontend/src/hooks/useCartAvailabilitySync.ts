"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import { ProductService } from "@/lib/productService";
import {
  isPurchasableCartItem,
  reconcileCartItems,
  type CartItem,
} from "@/store/cartSlice";
import type { AppDispatch, RootState } from "@/store/store";
import type { ProductDto, ProductStatus, ProductVariantDto } from "@/types/product";

const LIVE_CART_TOAST_ID = "live-cart-refresh";

type ReconcileResult = {
  update: {
    lineId: string;
    name: string;
    variantLabel: string;
    variantSku: string;
    price: number;
    imageUrl?: string | null;
    stockQuantity: number;
    quantity: number;
    status: ProductStatus;
    selected: boolean;
    availabilityIssue?: string | null;
  };
  changed: boolean;
  unavailable: boolean;
  quantityReduced: boolean;
  priceChanged: boolean;
};

const getBlockingReason = (
  item: CartItem,
  product: ProductDto | null | undefined,
  variant: ProductVariantDto | null,
): string | null => {
  if (product === null) {
    return "This product is no longer available and was removed from checkout.";
  }

  if (!product || product.status !== "ACTIVE") {
    return "This product is currently unavailable and was removed from checkout.";
  }

  if (!variant) {
    return "This variant is no longer available and was removed from checkout.";
  }

  if (variant.status !== "ACTIVE") {
    return "This variant is currently unavailable and was removed from checkout.";
  }

  if (variant.stockQuantity <= 0) {
    return "This item is out of stock and was removed from checkout.";
  }

  if (item.quantity > variant.stockQuantity) {
    return `Quantity was reduced to ${variant.stockQuantity} to match current stock.`;
  }

  return null;
};

const reconcileCartItem = (
  item: CartItem,
  product: ProductDto | null | undefined,
): ReconcileResult | null => {
  const variant =
    product?.variants.find((candidate) => candidate.id === item.variantId) ?? null;
  const blockingReason = getBlockingReason(item, product, variant);

  const nextStatus: ProductStatus =
    product == null || !variant
      ? "ARCHIVED"
      : variant.stockQuantity <= 0 && variant.status === "ACTIVE"
        ? "OUT_OF_STOCK"
        : variant.status;
  const nextStockQuantity =
    product == null || !variant || nextStatus !== "ACTIVE"
      ? Math.max(variant?.stockQuantity ?? 0, 0)
      : variant.stockQuantity;
  const nextQuantity =
    variant && nextStatus === "ACTIVE"
      ? Math.min(item.quantity, Math.max(variant.stockQuantity, 1))
      : item.quantity;
  const nextSelected =
    item.selected === false
      ? false
      : nextStatus === "ACTIVE" && nextStockQuantity > 0
        ? true
        : false;
  const nextPrice = variant ? Number(variant.price) : item.price;
  const nextImageUrl =
    variant?.imageUrl ?? product?.mainImageUrl ?? product?.imageUrl ?? item.imageUrl;
  const update = {
    lineId: item.lineId,
    name: product?.name ?? item.name,
    variantLabel: variant?.label ?? item.variantLabel,
    variantSku: variant?.sku ?? item.variantSku,
    price: nextPrice,
    imageUrl: nextImageUrl,
    stockQuantity: nextStockQuantity,
    quantity: nextQuantity,
    status: nextStatus,
    selected: nextSelected,
    availabilityIssue: blockingReason,
  };

  const changed =
    update.name !== item.name ||
    update.variantLabel !== item.variantLabel ||
    update.variantSku !== item.variantSku ||
    update.price !== item.price ||
    update.imageUrl !== item.imageUrl ||
    update.stockQuantity !== item.stockQuantity ||
    update.quantity !== item.quantity ||
    update.status !== item.status ||
    update.selected !== (item.selected !== false) ||
    (update.availabilityIssue ?? null) !== (item.availabilityIssue ?? null);

  if (!changed) {
    return null;
  }

  return {
    update,
    changed,
    unavailable: nextStatus !== "ACTIVE" || nextStockQuantity <= 0,
    quantityReduced: nextQuantity < item.quantity,
    priceChanged: nextPrice !== item.price,
  };
};

export function useCartAvailabilitySync() {
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const [isSyncing, setIsSyncing] = useState(cartItems.length > 0);
  const [syncError, setSyncError] = useState<string | null>(null);

  const validationKey = useMemo(
    () =>
      cartItems
        .map((item) =>
          [
            item.lineId,
            item.productId,
            item.variantId,
            item.quantity,
            item.price,
            item.stockQuantity,
            item.status,
          ].join(":"),
        )
        .join("|"),
    [cartItems],
  );
  // We intentionally keep the live-validation snapshot stable across selection-only changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const itemsToValidate = useMemo(() => cartItems, [validationKey]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (itemsToValidate.length === 0) {
        queueMicrotask(() => {
          if (!cancelled) {
            setIsSyncing(false);
            setSyncError(null);
          }
        });
        return;
      }

      setIsSyncing(true);
      setSyncError(null);

      const uniqueProductIds = Array.from(
        new Set(itemsToValidate.map((item) => item.productId)),
      );
      const productEntries = await Promise.all(
        uniqueProductIds.map(async (productId) => {
          try {
            const product = await ProductService.getProductById(productId);
            return [productId, product] as const;
          } catch (error) {
            const status =
              typeof error === "object" &&
              error !== null &&
              "status" in error &&
              typeof error.status === "number"
                ? error.status
                : null;

            if (status === 404) {
              return [productId, null] as const;
            }

            throw error;
          }
        }),
      ).catch(() => null);

      if (cancelled) {
        return;
      }

      if (!productEntries) {
        setSyncError("Live cart availability could not be refreshed right now.");
        setIsSyncing(false);
        return;
      }

      const productsById = new Map(productEntries);
      const updates = [];
      let unavailableCount = 0;
      let quantityAdjustedCount = 0;
      let priceChangedCount = 0;

      for (const item of itemsToValidate) {
        const result = reconcileCartItem(item, productsById.get(item.productId));

        if (!result) {
          continue;
        }

        updates.push(result.update);

        if (
          result.unavailable &&
          (!isPurchasableCartItem(item) || result.update.selected === false)
        ) {
          unavailableCount += 1;
        }

        if (result.quantityReduced) {
          quantityAdjustedCount += 1;
        }

        if (result.priceChanged) {
          priceChangedCount += 1;
        }
      }

      if (updates.length > 0) {
        dispatch(reconcileCartItems(updates));

        if (unavailableCount > 0) {
          toast.error(
            "Some cart items are no longer available. Please review your cart.",
            { id: LIVE_CART_TOAST_ID },
          );
        } else if (quantityAdjustedCount > 0 || priceChangedCount > 0) {
          toast("Your cart was updated to match current stock and pricing.", {
            id: LIVE_CART_TOAST_ID,
          });
        }
      }

      setIsSyncing(false);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [dispatch, itemsToValidate]);

  const blockingItemCount = useMemo(
    () => cartItems.filter((item) => !isPurchasableCartItem(item)).length,
    [cartItems],
  );

  return {
    isSyncing,
    syncError,
    blockingItemCount,
  };
}
