import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { CreateOrderInput, Order, OrderStatus, PaymentMethod, RealtimeStatus } from '@/types';
import {
  createMockOrder,
  deleteMockOrder,
  getMockOrders,
  subscribeMockChanges,
  updateMockOrderStatus,
} from './mockData';
import {
  loadLocalOrders,
  loadQueue,
  queueCreateOrder,
  queueDeleteOrder,
  queueSetStatus,
} from './offlineQueue';
import { addSyncListener, runSync, type SyncStatus } from './syncEngine';
import { requireSupabase, supabase } from './supabase';

export const ordersQueryKey = ['orders'] as const;

function isRemoteData() {
  return useAuthStore.getState().dataMode === 'supabase';
}

function mapOrder(
  row: Record<string, unknown>,
  itemRows: Record<string, unknown>[],
  userNames: Map<string, string>,
): Order {
  const rawPayment = (row as { payment_method?: unknown }).payment_method;
  const paymentMethod: PaymentMethod | null =
    rawPayment === 'CASH' || rawPayment === 'UPI' ? rawPayment : null;
  return {
    id: String(row.id),
    orderNumber: Number(row.order_number),
    status: row.status as OrderStatus,
    notes: String(row.notes ?? ''),
    paymentMethod,
    createdBy: row.created_by ? String(row.created_by) : null,
    createdByName: row.created_by ? userNames.get(String(row.created_by)) ?? null : null,
    createdAt: String(row.created_at),
    startedAt: row.started_at ? String(row.started_at) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
    items: itemRows.map((item) => ({
        id: String(item.id),
        orderId: String(item.order_id ?? row.id),
        menuItemId: item.menu_item_id ? String(item.menu_item_id) : null,
        itemName: String(item.item_name),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        notes: String(item.notes ?? ''),
      })),
  };
}

export async function getOrders(): Promise<Order[]> {
  if (!isRemoteData()) return getMockOrders();

  const client = requireSupabase();

  // Merge any locally-queued (offline) orders into the result.
  // These are optimistic records that haven't reached Supabase yet.
  const localOrders = await loadLocalOrders();

  let remoteOrders: Order[] = [];
  try {
    // KEY FIX: Use Supabase relational join (select '*, order_items(*)')
    // instead of a separate flat query for order_items.
    //
    // The old flat query — .from('order_items').select('*').limit(5000) —
    // was silently capped at Supabase's project-level max-rows setting
    // (default: 1000). Once total order_items exceeded ~1000 rows, the
    // newest items were dropped, making every new order show "0 items / ₹0".
    //
    // Embedded joins scope items per-order row, bypassing the global cap.
    const [orderResult, userResult] = await Promise.all([
      client
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(1000),
      client.from('users').select('id, name'),
    ]);
    if (orderResult.error) throw orderResult.error;
    if (userResult.error) throw userResult.error;

    const userNames = new Map(
      ((userResult.data ?? []) as Record<string, unknown>[]).map((user) => [
        String(user.id),
        String(user.name),
      ]),
    );
    remoteOrders = (orderResult.data as Record<string, unknown>[]).map((row) => {
      // Supabase returns joined rows as an array under the foreign table name.
      const nestedItems = (row.order_items as Record<string, unknown>[] | null) ?? [];
      return mapOrder(row, nestedItems, userNames);
    });
  } catch (err) {
    // Supabase unreachable — return local orders only so the UI doesn't crash.
    console.warn('[Orders] Supabase fetch failed, serving local orders only:', err);
    return localOrders.length > 0 ? localOrders : [];
  }

  // Prepend local orders that don't yet exist in Supabase (temp offline-* ids)
  const remoteIds = new Set(remoteOrders.map((o) => o.id));
  const pendingLocal = localOrders.filter((o) => !remoteIds.has(o.id));
  return [...pendingLocal, ...remoteOrders];
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  if (input.items.length === 0) throw new Error('Add at least one item before placing the order.');
  if (!isRemoteData()) return createMockOrder(input);

  const client = requireSupabase();
  try {
    const { data: orderRow, error: orderError } = await client
      .from('orders')
      .insert({ notes: input.notes.trim(), created_by: input.createdBy })
      .select()
      .single();
    if (orderError || !orderRow) throw orderError ?? new Error('Could not create order.');

    const { data: itemRows, error: itemsError } = await client
      .from('order_items')
      .insert(
        input.items.map((item) => ({
          order_id: orderRow.id,
          menu_item_id: item.menuItemId,
          item_name: item.itemName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          notes: item.notes.trim(),
        })),
      )
      .select();
    if (itemsError) {
      await client.from('orders').delete().eq('id', orderRow.id);
      throw itemsError;
    }

    return mapOrder(orderRow as Record<string, unknown>, itemRows as Record<string, unknown>[], new Map());
  } catch (err) {
    // Supabase is down — store locally and queue for later sync.
    console.warn('[Orders] createOrder offline, queuing locally:', err);
    const existing = await getOrders().catch(() => []);
    const maxOrderNum = existing.reduce((max, o) => Math.max(max, o.orderNumber), 16000);
    const localOrder = await queueCreateOrder(input, maxOrderNum + 1);
    // Trigger sync attempt in background
    void runSync();
    return localOrder;
  }
}

export async function setOrderStatus(
  id: string,
  status: OrderStatus,
  options?: { paymentMethod?: PaymentMethod | null },
) {
  if (!isRemoteData()) return updateMockOrderStatus(id, status, options?.paymentMethod);

  // If id is a local offline id, queue and return early.
  if (id.startsWith('offline-')) {
    await queueSetStatus(id, status, options?.paymentMethod);
    void runSync();
    const orders = await getOrders();
    const updated = orders.find((order) => order.id === id);
    if (!updated) throw new Error('Local order not found.');
    return updated;
  }

  try {
    // The database trigger owns lifecycle timestamps. The client only requests
    // the transition, which keeps the RLS column grant intentionally narrow.
    const { error } = await requireSupabase().from('orders').update({ status }).eq('id', id);
    if (error) throw error;

    // Payment method is tracked best-effort so the queue keeps working before
    // the `payment_method` migration has been applied to Supabase.
    if (status === 'COMPLETED' && options?.paymentMethod) {
      try {
        const { error: paymentError } = await requireSupabase()
          .from('orders')
          // Cast keeps this compiling until the generated DB types include the column.
          .update({ payment_method: options.paymentMethod } as never)
          .eq('id', id);
        if (paymentError) throw paymentError;
      } catch {
        // Column missing or not permitted yet — the mock store still records it.
      }
    }

    const orders = await getOrders();
    const updated = orders.find((order) => order.id === id);
    if (!updated) throw new Error('Order not found after update.');
    return updated;
  } catch (err) {
    // Supabase is down — queue the status change locally.
    console.warn('[Orders] setOrderStatus offline, queuing locally:', err);
    await queueSetStatus(id, status, options?.paymentMethod);
    void runSync();
    const orders = await getOrders();
    const updated = orders.find((order) => order.id === id);
    if (!updated) throw new Error('Order not found after queuing status update.');
    return updated;
  }
}

export function subscribeToOrderChanges(
  onChange: () => void,
  onStatus?: (status: RealtimeStatus) => void,
) {
  if (!isRemoteData()) return subscribeMockChanges(onChange, onStatus);
  if (!supabase) {
    onStatus?.('offline');
    return () => undefined;
  }

  onStatus?.('connecting');
  const client = supabase;
  const channel = client
    .channel(`cupandco-orders-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      () => onChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'order_items' },
      () => onChange(),
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') onStatus?.('live');
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        onStatus?.('offline');
      }
    });

  return () => {
    void client.removeChannel(channel);
    onStatus?.('offline');
  };
}

export function useOrdersQuery() {
  return useQuery({
    queryKey: ordersQueryKey,
    queryFn: getOrders,
    staleTime: 15_000,
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  });
}

export function useStartOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setOrderStatus(id, 'IN_PROGRESS'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  });
}

export function useCompleteOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; paymentMethod?: PaymentMethod | null }) =>
      setOrderStatus(input.id, 'COMPLETED', { paymentMethod: input.paymentMethod }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setOrderStatus(id, 'CANCELLED'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  });
}

export async function deleteOrder(id: string) {
  if (!isRemoteData()) return deleteMockOrder(id);

  // Local-only offline order — just queue the delete
  if (id.startsWith('offline-')) {
    await queueDeleteOrder(id);
    void runSync();
    return;
  }

  try {
    // Order lines cascade via FK (order_items.order_id ON DELETE CASCADE).
    // RLS `orders_delete_manager` restricts this to owners/managers.
    const { error } = await requireSupabase().from('orders').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.warn('[Orders] deleteOrder offline, queuing locally:', err);
    await queueDeleteOrder(id);
    void runSync();
  }
}

export function useDeleteOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  });
}

export function useRealtimeOrders(): RealtimeStatus {
  const queryClient = useQueryClient();
  const realtimeEnabled = useSettingsStore((state) => state.realtimeEnabled);
  const [status, setStatus] = useState<RealtimeStatus>(
    realtimeEnabled ? 'connecting' : 'offline',
  );

  useEffect(() => {
    if (!realtimeEnabled) return undefined;
    return subscribeToOrderChanges(
      () => void queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
      setStatus,
    );
  }, [queryClient, realtimeEnabled]);

  return status;
}

/**
 * Hook that exposes the offline sync status and number of pending queue entries.
 * Use this to show a "Syncing…" / "Offline – X pending" banner in the UI.
 */
export function useOfflineSync() {
  const queryClient = useQueryClient();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Bootstrap count from storage
    void loadQueue().then((q) => setPendingCount(q.length));

    const unsub = addSyncListener((status, count) => {
      setSyncStatus(status);
      setPendingCount(count);
      // When sync completes, refresh the orders list
      if (status === 'idle' && count === 0) {
        void queryClient.invalidateQueries({ queryKey: ordersQueryKey });
      }
    });
    return unsub;
  }, [queryClient]);

  return { syncStatus, pendingCount };
}

/** Returns the number of orders sitting in the offline queue (for badge display). */
export function useOfflinePendingCount(): number {
  const { pendingCount } = useOfflineSync();
  return pendingCount;
}
