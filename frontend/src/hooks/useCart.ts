'use client';

import { useCartStore } from '@/stores/cartStore';

const FREE_SHIPPING_THRESHOLD = 250000;

export function useCart() {
  const store = useCartStore();

  return {
    items: store.items,
    isDrawerOpen: store.isDrawerOpen,
    hasHydrated: store._hasHydrated,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    openDrawer: store.openDrawer,
    closeDrawer: store.closeDrawer,
    totalItems: store.totalItems(),
    subtotal: store.subtotal(),
    isFreeShipping: store.subtotal() >= FREE_SHIPPING_THRESHOLD,
  };
}
