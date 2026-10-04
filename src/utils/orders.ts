import type { Order, PaymentMethod } from '@/types';
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

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
};

export function getPaymentMethodLabel(paymentMethod: PaymentMethod | null | undefined) {
  if (!paymentMethod) return null;
  return PAYMENT_METHOD_LABELS[paymentMethod] ?? null;
}
