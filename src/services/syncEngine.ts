/**
 * syncEngine.ts
 *
 * Processes the offline queue when Supabase connectivity is restored.
 * Uses a polling loop + Supabase realtime connection status to detect
 * when the database is reachable again, then replays all queued writes.
 *
 * Usage: call `startSyncEngine()` once at app startup.
 * The engine stops automatically when there's nothing left to sync.
 */

import type { CreateOrderInput, OrderStatus, PaymentMethod } from '@/types';
import {
  clearLocalOrders,
  dequeue,
  loadLocalOrders,
  loadQueue,
  type QueuedCreateOrder,
  type QueuedDeleteOrder,
  type QueuedSetStatus,
  removeLocalOrder,
} from './offlineQueue';
import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export type SyncListener = (status: SyncStatus, pendingCount: number) => void;

// ─── State ────────────────────────────────────────────────────────────────────

const listeners = new Set<SyncListener>();
let currentStatus: SyncStatus = 'idle';
let pollTimer: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;

// ─── Listeners ────────────────────────────────────────────────────────────────

export function addSyncListener(fn: SyncListener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

async function emit(status: SyncStatus) {
  currentStatus = status;
  const queue = await loadQueue();
  listeners.forEach((fn) => fn(status, queue.length));
}

export function getSyncStatus() {
  return currentStatus;
}

// ─── Connectivity check ───────────────────────────────────────────────────────

async function isSupabaseReachable(): Promise<boolean> {
  if (!supabase) return false;
  try {
    // Lightweight ping: fetch a single row from orders (RLS may return 0 rows, that's fine)
    const { error } = await supabase.from('orders').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// ─── Process individual queue entries ─────────────────────────────────────────

async function processCreateOrder(entry: QueuedCreateOrder): Promise<boolean> {
  if (!supabase) return false;
  const input: CreateOrderInput = entry.payload;

  try {
    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert({ notes: input.notes.trim(), created_by: input.createdBy })
      .select()
      .single();
    if (orderError || !orderRow) throw orderError ?? new Error('Failed to create order.');

    if (input.items.length > 0) {
      const { error: itemsError } = await supabase.from('order_items').insert(
        input.items.map((item) => ({
          order_id: orderRow.id,
          menu_item_id: item.menuItemId,
          item_name: item.itemName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          notes: item.notes.trim(),
        })),
      );
      if (itemsError) {
        await supabase.from('orders').delete().eq('id', orderRow.id);
        throw itemsError;
      }
    }

    // Remove the local optimistic record now that it's in Supabase
    await removeLocalOrder(entry.localOrder.id);
    await dequeue(entry.id);
    return true;
  } catch (err) {
    console.warn('[SyncEngine] createOrder failed:', err);
    return false;
  }
}

async function processSetStatus(entry: QueuedSetStatus): Promise<boolean> {
  if (!supabase) return false;
  // If the orderId is a local temp id, skip — the CREATE_ORDER entry
  // will handle it first and its local id won't exist in Supabase.
  // We detect local ids by their "offline-" prefix.
  if (entry.orderId.startsWith('offline-')) {
    // Defer: wait until CREATE_ORDER is processed and real id is known.
    // For now, skip gracefully (the order will arrive in PENDING from Supabase).
    await dequeue(entry.id);
    return true;
  }

  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: entry.status })
      .eq('id', entry.orderId);
    if (error) throw error;

    if (entry.status === 'COMPLETED' && entry.paymentMethod) {
      try {
        await supabase
          .from('orders')
          .update({ payment_method: entry.paymentMethod } as never)
          .eq('id', entry.orderId);
      } catch {
        // column may not exist yet
      }
    }

    await removeLocalOrder(entry.orderId);
    await dequeue(entry.id);
    return true;
  } catch (err) {
    console.warn('[SyncEngine] setStatus failed:', err);
    return false;
  }
}

async function processDeleteOrder(entry: QueuedDeleteOrder): Promise<boolean> {
  if (!supabase) return false;
  if (entry.orderId.startsWith('offline-')) {
    // Already removed locally, just clear queue entry
    await dequeue(entry.id);
    return true;
  }

  try {
    const { error } = await supabase.from('orders').delete().eq('id', entry.orderId);
    if (error) throw error;
    await dequeue(entry.id);
    return true;
  } catch (err) {
    console.warn('[SyncEngine] deleteOrder failed:', err);
    return false;
  }
}

// ─── Main sync loop ───────────────────────────────────────────────────────────

export async function runSync(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  const queue = await loadQueue();
  if (queue.length === 0) {
    isSyncing = false;
    await emit('idle');
    return;
  }

  const reachable = await isSupabaseReachable();
  if (!reachable) {
    isSyncing = false;
    await emit('offline');
    schedulePoll();
    return;
  }

  await emit('syncing');

  let allSucceeded = true;
  for (const entry of queue) {
    let ok = false;
    if (entry.type === 'CREATE_ORDER') ok = await processCreateOrder(entry);
    else if (entry.type === 'SET_STATUS') ok = await processSetStatus(entry);
    else if (entry.type === 'DELETE_ORDER') ok = await processDeleteOrder(entry);

    if (!ok) {
      allSucceeded = false;
      break; // stop processing; retry whole queue on next poll
    }
  }

  isSyncing = false;

  const remaining = await loadQueue();
  if (remaining.length === 0) {
    await clearLocalOrders();
    await emit('idle');
  } else if (allSucceeded) {
    await emit('idle');
  } else {
    await emit('error');
    schedulePoll();
  }
}

// ─── Polling ──────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 15_000; // 15 seconds

function schedulePoll() {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = setTimeout(() => {
    pollTimer = null;
    void runSync();
  }, POLL_INTERVAL_MS);
}

export function stopSyncEngine() {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}

/**
 * Call once at app startup. Checks for any pending queue items and starts
 * the sync process. Safe to call multiple times.
 */
export async function startSyncEngine(): Promise<void> {
  const queue = await loadQueue();
  const localOrders = await loadLocalOrders();

  if (queue.length > 0 || localOrders.length > 0) {
    void runSync();
  } else {
    await emit('idle');
  }
}
