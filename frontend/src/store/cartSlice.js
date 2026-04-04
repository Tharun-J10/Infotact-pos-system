import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalAmount: 0,
  },
  reducers: {
    addToCart(state, action) {
      const newItem = action.payload;
      
      // THE FIX: Explicitly match the 'productId' we send from App.jsx
      const existingItem = state.items.find(item => item.productId === newItem.productId);

      if (!existingItem) {
        state.items.push({
          productId: newItem.productId,
          name: newItem.name,
          price: newItem.price,
          quantity: 1
        });
      } else {
        existingItem.quantity++;
      }
      
      // Update the total price
      state.totalAmount += newItem.price;
    },
    clearCart(state) {
      state.items = [];
      state.totalAmount = 0;
    }
  }
});

export const { addToCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;