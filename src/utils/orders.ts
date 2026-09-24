import type { Order } from '@/types';
import { formatCurrency } from './formatters';

export function getOrderSubtotal(order: Order) {
  return order.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
}

export function getOrderItemCount(order: Order) {
  return order.items.reduce((total, item) => total + item.quantity, 0);
}

export function getOrderTotalLabel(order: Order) {
  return formatCurrency(getOrderSubtotal(order));
}
