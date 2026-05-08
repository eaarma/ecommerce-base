import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { ProductStatus } from "@/types/product";

export type CartItem = {
  lineId: string;
  productId: number;
  variantId: number;
  name: string;
  variantLabel: string;
  variantSku: string;
  price: number;
  imageUrl?: string | null;
  stockQuantity: number;
  quantity: number;
  status: ProductStatus;
  availabilityIssue?: string | null;
  selected?: boolean;
};

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

export const createCartLineId = (productId: number, variantId: number) =>
  `${productId}:${variantId}`;

type AddToCartPayload = {
  productId: number;
  variantId: number;
  name: string;
  variantLabel: string;
  variantSku: string;
  price: number;
  imageUrl?: string | null;
  stockQuantity: number;
  quantity?: number;
  status: ProductStatus;
};

type UpdateQuantityPayload = {
  lineId: string;
  quantity: number;
};

type ReconcileCartLinePayload = {
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

const isSelected = (item: CartItem) => item.selected !== false;
export const isPurchasableCartItem = (item: CartItem) =>
  item.status === "ACTIVE" && item.stockQuantity > 0 && item.quantity > 0;

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<AddToCartPayload>) => {
      const {
        productId,
        variantId,
        name,
        variantLabel,
        variantSku,
        price,
        imageUrl,
        stockQuantity,
        quantity = 1,
        status,
      } = action.payload;
      const lineId = createCartLineId(productId, variantId);

      const existingItem = state.items.find((item) => item.lineId === lineId);

      if (existingItem) {
        existingItem.quantity = Math.min(
          existingItem.quantity + quantity,
          existingItem.stockQuantity,
        );
        existingItem.stockQuantity = stockQuantity;
        existingItem.price = price;
        existingItem.name = name;
        existingItem.variantLabel = variantLabel;
        existingItem.variantSku = variantSku;
        existingItem.imageUrl = imageUrl;
        existingItem.status = status;
        existingItem.availabilityIssue = null;
        existingItem.selected = isSelected(existingItem);
      } else {
        state.items.push({
          lineId,
          productId,
          variantId,
          name,
          variantLabel,
          variantSku,
          price,
          imageUrl,
          stockQuantity,
          quantity: Math.min(quantity, stockQuantity),
          status,
          availabilityIssue: null,
          selected: true,
        });
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.lineId !== action.payload);
    },

    updateQuantity: (state, action: PayloadAction<UpdateQuantityPayload>) => {
      const item = state.items.find(
        (cartItem) => cartItem.lineId === action.payload.lineId,
      );

      if (!item) return;

      if (action.payload.quantity <= 0) {
        state.items = state.items.filter(
          (cartItem) => cartItem.lineId !== action.payload.lineId,
        );
        return;
      }

      item.quantity = Math.min(action.payload.quantity, item.stockQuantity);
    },

    increaseQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find(
        (cartItem) => cartItem.lineId === action.payload,
      );

      if (!item) return;

      if (item.quantity < item.stockQuantity) {
        item.quantity += 1;
      }
    },

    decreaseQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find(
        (cartItem) => cartItem.lineId === action.payload,
      );

      if (!item) return;

      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        state.items = state.items.filter(
          (cartItem) => cartItem.lineId !== action.payload,
        );
      }
    },

    clearCart: (state) => {
      state.items = [];
    },

    toggleItemSelection: (state, action: PayloadAction<string>) => {
      const item = state.items.find(
        (cartItem) => cartItem.lineId === action.payload,
      );

      if (!item) return;

      if (!isPurchasableCartItem(item)) {
        item.selected = false;
        return;
      }

      item.selected = !isSelected(item);
    },

    setAllCartItemSelection: (state, action: PayloadAction<boolean>) => {
      state.items.forEach((item) => {
        item.selected = action.payload ? isPurchasableCartItem(item) : false;
      });
    },

    removeSelectedFromCart: (state) => {
      state.items = state.items.filter((item) => !isSelected(item));
    },

    reconcileCartItems: (
      state,
      action: PayloadAction<ReconcileCartLinePayload[]>,
    ) => {
      action.payload.forEach((update) => {
        const item = state.items.find(
          (cartItem) => cartItem.lineId === update.lineId,
        );

        if (!item) return;

        item.name = update.name;
        item.variantLabel = update.variantLabel;
        item.variantSku = update.variantSku;
        item.price = update.price;
        item.imageUrl = update.imageUrl;
        item.stockQuantity = update.stockQuantity;
        item.quantity = update.quantity;
        item.status = update.status;
        item.selected = update.selected;
        item.availabilityIssue = update.availabilityIssue ?? null;
      });
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  toggleItemSelection,
  setAllCartItemSelection,
  removeSelectedFromCart,
  reconcileCartItems,
} = cartSlice.actions;

export default cartSlice.reducer;
