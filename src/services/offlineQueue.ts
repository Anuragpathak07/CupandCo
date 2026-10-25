/**
 * offlineQueue.ts
 *
 * Offline-first queue that stores failed Supabase write operations in
 * AsyncStorage and replays them when connectivity is restored.
 *
 * Supports:
 *  - createOrder   → queued when Supabase is unreachable
 *  - setOrderStatus → queued when Supabase is unreachable
 *  - deleteOrder   → queued when Supabase is unreachable
 *
 * The queue is persisted so it survives page refreshes / app restarts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CreateOrderInput, Order, OrderStatus, PaymentMethod } from '@/types';

// ─── Queue entry types ────────────────────────────────────────────────────────

export type QueuedCreateOrder = {
  type: 'CREATE_ORDER';
  id: string; // local temp id (offline-xxx)
  payload: CreateOrderInput;
  localOrder: Order; // optimistic local record shown in UI
  enqueuedAt: string;
};

export type QueuedSetStatus = {
  type: 'SET_STATUS';
  id: string; // queue entry id
  orderId: string; // the real Supabase order id OR local temp id
  status: OrderStatus;
  paymentMethod?: PaymentMethod | null;
  enqueuedAt: string;
};

export type QueuedDeleteOrder = {
  type: 'DELETE_ORDER';
  id: string; // queue entry id
  orderId: string;
  enqueuedAt: string;
};

export type QueueEntry = QueuedCreateOrder | QueuedSetStatus | QueuedDeleteOrder;

// ─── Storage key ──────────────────────────────────────────────────────────────

const QUEUE_KEY = 'cupandco-offline-queue';
const LOCAL_ORDERS_KEY = 'cupandco-local-orders';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Queue persistence ────────────────────────────────────────────────────────

export async function loadQueue(): Promise<QueueEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueueEntry[]) : [];
  } catch {
    return [];
  }
}

export async function saveQueue(queue: QueueEntry[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueue(entry: QueueEntry): Promise<void> {
  const queue = await loadQueue();
  queue.push(entry);
  await saveQueue(queue);
}

export async function dequeue(id: string): Promise<void> {
  const queue = await loadQueue();
  await saveQueue(queue.filter((e) => e.id !== id));
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

// ─── Local orders (optimistic records) ───────────────────────────────────────

export async function loadLocalOrders(): Promise<Order[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

export async function saveLocalOrders(orders: Order[]): Promise<void> {
  await AsyncStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
}

export async function addLocalOrder(order: Order): Promise<void> {
  const orders = await loadLocalOrders();
  await saveLocalOrders([order, ...orders]);
}

export async function updateLocalOrderStatus(
  orderId: string,
  status: OrderStatus,
  paymentMethod?: PaymentMethod | null,
): Promise<void> {
  const orders = await loadLocalOrders();
  const timestamp = new Date().toISOString();
  await saveLocalOrders(
    orders.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        status,
        paymentMethod: status === 'COMPLETED' ? (paymentMethod ?? o.paymentMethod) : o.paymentMethod,
        startedAt: status === 'IN_PROGRESS' ? o.startedAt ?? timestamp : o.startedAt,
        completedAt: status === 'COMPLETED' ? timestamp : o.completedAt,
      };
    }),
  );
}

export async function removeLocalOrder(orderId: string): Promise<void> {
  const orders = await loadLocalOrders();
  await saveLocalOrders(orders.filter((o) => o.id !== orderId));
}

export async function clearLocalOrders(): Promise<void> {
  await AsyncStorage.removeItem(LOCAL_ORDERS_KEY);
}

// ─── Create a queued CREATE_ORDER entry ───────────────────────────────────────

export async function queueCreateOrder(
  input: CreateOrderInput,
  nextOrderNumber: number,
): Promise<Order> {
  const localId = generateId('offline');
  const now = new Date().toISOString();

  const localOrder: Order = {
    id: localId,
    orderNumber: nextOrderNumber,
    status: 'PENDING',
    notes: input.notes.trim(),
    paymentMethod: null,
    createdBy: input.createdBy,
    createdByName: null,
    createdAt: now,
    startedAt: null,
    completedAt: null,
    items: input.items.map((item, i) => ({
      id: `${localId}-item-${i + 1}`,
      orderId: localId,
      menuItemId: item.menuItemId,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      notes: item.notes.trim(),
    })),
  };

  const entry: QueuedCreateOrder = {
    type: 'CREATE_ORDER',
    id: localId,
    payload: input,
    localOrder,
    enqueuedAt: now,
  };

  await enqueue(entry);
  await addLocalOrder(localOrder);

  return localOrder;
}

// ─── Create a queued SET_STATUS entry ────────────────────────────────────────

export async function queueSetStatus(
  orderId: string,
  status: OrderStatus,
  paymentMethod?: PaymentMethod | null,
): Promise<void> {
  const entry: QueuedSetStatus = {
    type: 'SET_STATUS',
    id: generateId('status'),
    orderId,
    status,
    paymentMethod,
    enqueuedAt: new Date().toISOString(),
  };

  await enqueue(entry);
  await updateLocalOrderStatus(orderId, status, paymentMethod);
}

// ─── Create a queued DELETE_ORDER entry ───────────────────────────────────────

export async function queueDeleteOrder(orderId: string): Promise<void> {
  const entry: QueuedDeleteOrder = {
    type: 'DELETE_ORDER',
    id: generateId('delete'),
    orderId,
    enqueuedAt: new Date().toISOString(),
  };

  await enqueue(entry);
  await removeLocalOrder(orderId);
}
