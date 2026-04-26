import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CartItem = {
  productId: number;
  name: string;
  price: number;
  imageUrl?: string | null;
  stockQuantity: number;
  quantity: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "OUT_OF_STOCK";
  selected?: boolean;
};

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

type AddToCartPayload = {
  productId: number;
  name: string;
  price: number;
  imageUrl?: string | null;
  stockQuantity: number;
  quantity?: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "OUT_OF_STOCK";
};

type UpdateQuantityPayload = {
  productId: number;
  quantity: number;
};

const isSelected = (item: CartItem) => item.selected !== false;

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<AddToCartPayload>) => {
      const {
        productId,
        name,
        price,
        imageUrl,
        stockQuantity,
        quantity = 1,
        status,
      } = action.payload;

      const existingItem = state.items.find(
        (item) => item.productId === productId,
      );

      if (existingItem) {
        existingItem.quantity = Math.min(
          existingItem.quantity + quantity,
          existingItem.stockQuantity,
        );
        existingItem.stockQuantity = stockQuantity;
        existingItem.price = price;
        existingItem.name = name;
        existingItem.imageUrl = imageUrl;
        existingItem.status = status;
        existingItem.selected = isSelected(existingItem);
      } else {
        state.items.push({
          productId,
          name,
          price,
          imageUrl,
          stockQuantity,
          quantity: Math.min(quantity, stockQuantity),
          status,
          selected: true,
        });
      }
    },

    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload,
      );
    },

    updateQuantity: (state, action: PayloadAction<UpdateQuantityPayload>) => {
      const item = state.items.find(
        (cartItem) => cartItem.productId === action.payload.productId,
      );

      if (!item) return;

      if (action.payload.quantity <= 0) {
        state.items = state.items.filter(
          (cartItem) => cartItem.productId !== action.payload.productId,
        );
        return;
      }

      item.quantity = Math.min(action.payload.quantity, item.stockQuantity);
    },

    increaseQuantity: (state, action: PayloadAction<number>) => {
      const item = state.items.find(
        (cartItem) => cartItem.productId === action.payload,
      );

      if (!item) return;

      if (item.quantity < item.stockQuantity) {
        item.quantity += 1;
      }
    },

    decreaseQuantity: (state, action: PayloadAction<number>) => {
      const item = state.items.find(
        (cartItem) => cartItem.productId === action.payload,
      );

      if (!item) return;

      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        state.items = state.items.filter(
          (cartItem) => cartItem.productId !== action.payload,
        );
      }
    },

    clearCart: (state) => {
      state.items = [];
    },

    toggleItemSelection: (state, action: PayloadAction<number>) => {
      const item = state.items.find(
        (cartItem) => cartItem.productId === action.payload,
      );

      if (!item) return;

      item.selected = !isSelected(item);
    },

    setAllCartItemSelection: (state, action: PayloadAction<boolean>) => {
      state.items.forEach((item) => {
        item.selected = action.payload;
      });
    },

    removeSelectedFromCart: (state) => {
      state.items = state.items.filter((item) => !isSelected(item));
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
} = cartSlice.actions;

export default cartSlice.reducer;
