import { create } from 'zustand';

import type { CartLine, MenuItem } from '@/types';

interface CartState {
  lines: CartLine[];
  notes: string;
  addItem: (menuItem: MenuItem) => void;
  increment: (menuItemId: string) => void;
  decrement: (menuItemId: string) => void;
  remove: (menuItemId: string) => void;
  updateNotes: (menuItemId: string, notes: string) => void;
  setOrderNotes: (notes: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  lines: [],
  notes: '',
  addItem: (menuItem) =>
    set((state) => {
      const existing = state.lines.find((line) => line.menuItem.id === menuItem.id);
      if (existing) {
        return {
          lines: state.lines.map((line) =>
            line.menuItem.id === menuItem.id ? { ...line, quantity: line.quantity + 1 } : line,
          ),
        };
      }
      return { lines: [...state.lines, { menuItem, quantity: 1, notes: '' }] };
    }),
  increment: (menuItemId) =>
    set((state) => ({
      lines: state.lines.map((line) =>
        line.menuItem.id === menuItemId ? { ...line, quantity: line.quantity + 1 } : line,
      ),
    })),
  decrement: (menuItemId) =>
    set((state) => ({
      lines: state.lines
        .map((line) =>
          line.menuItem.id === menuItemId ? { ...line, quantity: line.quantity - 1 } : line,
        )
        .filter((line) => line.quantity > 0),
    })),
  remove: (menuItemId) =>
    set((state) => ({ lines: state.lines.filter((line) => line.menuItem.id !== menuItemId) })),
  updateNotes: (menuItemId, notes) =>
    set((state) => ({
      lines: state.lines.map((line) =>
        line.menuItem.id === menuItemId ? { ...line, notes } : line,
      ),
    })),
  setOrderNotes: (notes) => set({ notes }),
  clear: () => set({ lines: [], notes: '' }),
}));

export const selectCartCount = (state: CartState) =>
  state.lines.reduce((total, line) => total + line.quantity, 0);

export const selectCartSubtotal = (state: CartState) =>
  state.lines.reduce((total, line) => total + line.menuItem.price * line.quantity, 0);
