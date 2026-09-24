import type { MenuCategory, MenuItem } from '@/types';

const createdAt = '2026-01-01T08:00:00.000Z';

export const addedMenuCategories: MenuCategory[] = [
  { id: 'cat-fries', name: 'Fries', sortOrder: 11, createdAt },
  { id: 'cat-maggi', name: 'Maggi', sortOrder: 12, createdAt },
  { id: 'cat-momos', name: 'Momos', sortOrder: 13, createdAt },
  { id: 'cat-pizza', name: 'Pizza', sortOrder: 14, createdAt },
  { id: 'cat-air-fried', name: 'Air Fried', sortOrder: 15, createdAt },
];

function item(
  id: string,
  categoryId: string,
  name: string,
  price: number,
  sortOrder: number,
): MenuItem {
  return {
    id: `item-${id}`,
    categoryId,
    name,
    description: '',
    price,
    imageUrl: null,
    isAvailable: true,
    sortOrder,
    createdAt,
    updatedAt: createdAt,
  };
}

export const addedMenuItems: MenuItem[] = [
  // Fries
  item('classic-salted-fries', 'cat-fries', 'Classic Salted Fries', 99, 0),
  item('masala-fries', 'cat-fries', 'Masala Fries', 119, 1),
  item('peri-peri-fries', 'cat-fries', 'Peri Peri Fries', 129, 2),
  item('cheesy-fries', 'cat-fries', 'Cheesy Fries', 139, 3),
  item('mccain-smiles', 'cat-fries', 'McCain Smiles', 109, 4),
  item('classic-potato-wedges', 'cat-fries', 'Classic Potato Wedges', 119, 5),
  item('peri-peri-wedges', 'cat-fries', 'Peri Peri Wedges', 139, 6),
  item('jalapeno-cheesy-pops', 'cat-fries', 'Jalapeño Cheesy Pops', 149, 7),
  item('chicken-popcorn', 'cat-fries', 'Chicken Popcorn', 159, 8),

  // Maggi — Schezwan Maggi is intentionally held because its price is unclear.
  item('plain-maggi', 'cat-maggi', 'Plain Maggi', 69, 0),
  item('plain-cheese-maggi', 'cat-maggi', 'Plain Cheese Maggi', 89, 1),
  item('cheese-corn-maggi', 'cat-maggi', 'Cheese Corn Maggi', 129, 2),

  // Steamed momos — half and full sizes are separate cashier items.
  item('momos-veg-half', 'cat-momos', 'Veg · 5 Pieces', 70, 0),
  item('momos-paneer-half', 'cat-momos', 'Paneer · 5 Pieces', 80, 1),
  item('momos-cheese-corn-half', 'cat-momos', 'Cheese Corn · 5 Pieces', 90, 2),
  item('momos-tandoori-paneer-half', 'cat-momos', 'Tandoori Paneer · 5 Pieces', 95, 3),
  item('momos-chicken-half', 'cat-momos', 'Chicken · 5 Pieces', 80, 4),
  item('momos-chicken-cheese-half', 'cat-momos', 'Chicken Cheese · 5 Pieces', 95, 5),
  item('momos-veg-full', 'cat-momos', 'Veg · 10 Pieces', 120, 6),
  item('momos-paneer-full', 'cat-momos', 'Paneer · 10 Pieces', 140, 7),
  item('momos-cheese-corn-full', 'cat-momos', 'Cheese Corn · 10 Pieces', 150, 8),
  item('momos-tandoori-paneer-full', 'cat-momos', 'Tandoori Paneer · 10 Pieces', 170, 9),
  item('momos-chicken-full', 'cat-momos', 'Chicken · 10 Pieces', 140, 10),
  item('momos-chicken-cheese-full', 'cat-momos', 'Chicken Cheese · 10 Pieces', 160, 11),

  // Pizza — unnamed ₹129/₹139 variants are intentionally held.
  item('classic-margherita', 'cat-pizza', 'Classic Margherita', 109, 0),

  // Air fried — half and full sizes are separate cashier items.
  item('air-fried-veg-half', 'cat-air-fried', 'Air Fried Veg · 5 Pieces', 75, 0),
  item('air-fried-paneer-half', 'cat-air-fried', 'Air Fried Paneer · 5 Pieces', 90, 1),
  item('air-fried-cheese-corn-half', 'cat-air-fried', 'Air Fried Cheese & Corn · 5 Pieces', 95, 2),
  item('air-fried-tandoori-half', 'cat-air-fried', 'Air Fried Tandoori · 5 Pieces', 100, 3),
  item('air-fried-chicken-half', 'cat-air-fried', 'Air Fried Chicken · 5 Pieces', 80, 4),
  item('air-fried-chicken-cheese-half', 'cat-air-fried', 'Air Fried Chicken Cheese · 5 Pieces', 95, 5),
  item('air-fried-veg-full', 'cat-air-fried', 'Air Fried Veg · 10 Pieces', 130, 6),
  item('air-fried-paneer-full', 'cat-air-fried', 'Air Fried Paneer · 10 Pieces', 150, 7),
  item('air-fried-cheese-corn-full', 'cat-air-fried', 'Air Fried Cheese & Corn · 10 Pieces', 160, 8),
  item('air-fried-tandoori-full', 'cat-air-fried', 'Air Fried Tandoori · 10 Pieces', 180, 9),
  item('air-fried-chicken-full', 'cat-air-fried', 'Air Fried Chicken · 10 Pieces', 140, 10),
  item('air-fried-chicken-cheese-full', 'cat-air-fried', 'Air Fried Chicken Cheese · 10 Pieces', 160, 11),
];
