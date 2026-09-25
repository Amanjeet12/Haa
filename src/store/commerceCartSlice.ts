import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CommerceCartSource = 'ecommerce' | 'global';

export type CommerceCartProduct = {
  id: string;
  name: string;
  price: number;
  image: string | number;
  detail?: string;
  brand?: string;
  vendorName?: string;
  estimatedDelivery?: string;
  zoneId?: number;
};

export type CommerceCartItem = CommerceCartProduct & { quantity: number };

type CommerceCartState = { source: CommerceCartSource | null; items: CommerceCartItem[] };
const initialState: CommerceCartState = { source: null, items: [] };

const commerceCartSlice = createSlice({
  name: 'commerceCart',
  initialState,
  reducers: {
    addCommerceItem(state, action: PayloadAction<{ source: CommerceCartSource; product: CommerceCartProduct }>) {
      const { source, product } = action.payload;
      if (state.source && state.source !== source) state.items = [];
      state.source = source;
      const existing = state.items.find(item => item.id === product.id);
      if (existing) existing.quantity += 1;
      else state.items.push({ ...product, quantity: 1 });
    },
    setCommerceItemQuantity(state, action: PayloadAction<{ id: string; quantity: number }>) {
      const item = state.items.find(candidate => candidate.id === action.payload.id);
      if (item) item.quantity = Math.max(0, action.payload.quantity);
      state.items = state.items.filter(candidate => candidate.quantity > 0);
      if (!state.items.length) state.source = null;
    },
    removeCommerceItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter(item => item.id !== action.payload);
      if (!state.items.length) state.source = null;
    },
    clearCommerceCart() { return initialState; },
  },
});

export const { addCommerceItem, clearCommerceCart, removeCommerceItem, setCommerceItemQuantity } = commerceCartSlice.actions;
export const commerceCartReducer = commerceCartSlice.reducer;
