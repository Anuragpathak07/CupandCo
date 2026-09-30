import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { CreateOrderInput, Order, OrderStatus, RealtimeStatus } from '@/types';
import {
  createMockOrder,
  deleteMockOrder,
  getMockOrders,
  subscribeMockChanges,
  updateMockOrderStatus,
} from './mockData';
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
  return {
    id: String(row.id),
    orderNumber: Number(row.order_number),
    status: row.status as OrderStatus,
    notes: String(row.notes ?? ''),
    createdBy: row.created_by ? String(row.created_by) : null,
    createdByName: row.created_by ? userNames.get(String(row.created_by)) ?? null : null,
    createdAt: String(row.created_at),
    startedAt: row.started_at ? String(row.started_at) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
    items: itemRows
      .filter((item) => String(item.order_id) === String(row.id))
      .map((item) => ({
        id: String(item.id),
        orderId: String(item.order_id),
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
  const [orderResult, itemResult, userResult] = await Promise.all([
    client.from('orders').select('*').order('created_at', { ascending: false }).limit(1000),
    client.from('order_items').select('*').limit(5000),
    client.from('users').select('id, name'),
  ]);
  if (orderResult.error) throw orderResult.error;
  if (itemResult.error) throw itemResult.error;
  if (userResult.error) throw userResult.error;

  const userNames = new Map(
    ((userResult.data ?? []) as Record<string, unknown>[]).map((user) => [
      String(user.id),
      String(user.name),
    ]),
  );
  const items = itemResult.data as Record<string, unknown>[];
  return (orderResult.data as Record<string, unknown>[]).map((row) =>
    mapOrder(row, items, userNames),
  );
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  if (input.items.length === 0) throw new Error('Add at least one item before placing the order.');
  if (!isRemoteData()) return createMockOrder(input);

  const client = requireSupabase();
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
}

export async function setOrderStatus(id: string, status: OrderStatus) {
  if (!isRemoteData()) return updateMockOrderStatus(id, status);

  // The database trigger owns lifecycle timestamps. The client only requests
  // the transition, which keeps the RLS column grant intentionally narrow.
  const { error } = await requireSupabase().from('orders').update({ status }).eq('id', id);
  if (error) throw error;

  const orders = await getOrders();
  const updated = orders.find((order) => order.id === id);
  if (!updated) throw new Error('Order not found after update.');
  return updated;
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
    mutationFn: (id: string) => setOrderStatus(id, 'COMPLETED'),
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

  // Order lines cascade via FK (order_items.order_id ON DELETE CASCADE).
  // RLS `orders_delete_manager` restricts this to owners/managers.
  const { error } = await requireSupabase().from('orders').delete().eq('id', id);
  if (error) throw error;
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
