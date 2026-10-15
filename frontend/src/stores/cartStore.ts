import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types/cart';

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  _hasHydrated: boolean;

  couponCode: string;
  couponDiscount: number;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setHasHydrated: (state: boolean) => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;

  // Computed
  totalItems: () => number;
  subtotal: () => number;
}

function matchItem(item: CartItem, productId: string, variantId?: string) {
  return item.productId === productId && item.variantId === variantId;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      _hasHydrated: false,
      couponCode: '',
      couponDiscount: 0,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      addItem: (item: CartItem) => {
        set((state) => {
          const existing = state.items.find((i) =>
            matchItem(i, item.productId, item.variantId)
          );

          if (existing) {
            return {
              items: state.items.map((i) =>
                matchItem(i, item.productId, item.variantId)
                  ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxStock) }
                  : i
              ),
              isDrawerOpen: true,
            };
          }

          return {
            items: [...state.items, { ...item, quantity: Math.min(item.quantity, item.maxStock) }],
            isDrawerOpen: true,
          };
        });
      },

      removeItem: (productId: string, variantId?: string) => {
        set((state) => ({
          items: state.items.filter((i) => !matchItem(i, productId, variantId)),
        }));
      },

      updateQuantity: (productId: string, quantity: number, variantId?: string) => {
        set((state) => ({
          items: state.items.map((i) =>
            matchItem(i, productId, variantId)
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [], couponCode: '', couponDiscount: 0 }),
      applyCoupon: (code: string, discount: number) => set({ couponCode: code, couponDiscount: discount }),
      removeCoupon: () => set({ couponCode: '', couponDiscount: 0 }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'juguetes-cart',
      partialize: (state) => ({ items: state.items, couponCode: state.couponCode, couponDiscount: state.couponDiscount }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
