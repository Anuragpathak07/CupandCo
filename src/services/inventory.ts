import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/store/authStore';
import type { InventoryItem, InventoryMutationInput } from '@/types';
import {
  createMockInventoryItem,
  deleteMockInventoryItem,
  getMockInventory,
  updateMockInventoryItem,
} from './mockData';
import { requireSupabase } from './supabase';

export const inventoryQueryKey = ['inventory'] as const;

function isRemoteData() {
  return useAuthStore.getState().dataMode === 'supabase';
}

function mapInventoryItem(row: Record<string, unknown>): InventoryItem {
  return {
    id: String(row.id),
    name: String(row.name),
    quantity: Number(row.quantity ?? 0),
    unit: String(row.unit ?? 'pcs'),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function getInventory(): Promise<InventoryItem[]> {
  if (!isRemoteData()) return getMockInventory();

  const client = requireSupabase();
  const { data, error } = await client.from('inventory_items').select('*').order('name');
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapInventoryItem);
}

export async function createInventoryItem(input: InventoryMutationInput): Promise<InventoryItem> {
  const payload = {
    name: input.name.trim(),
    quantity: Math.max(0, Math.floor(input.quantity)),
    unit: input.unit.trim() || 'pcs',
  };
  if (!payload.name) throw new Error('Give the inventory item a name.');
  if (!isRemoteData()) return createMockInventoryItem(payload);

  const { data, error } = await requireSupabase()
    .from('inventory_items')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return mapInventoryItem(data as Record<string, unknown>);
}

export async function updateInventoryItem(
  id: string,
  input: Partial<InventoryMutationInput>,
): Promise<InventoryItem> {
  if (!isRemoteData()) return updateMockInventoryItem(id, input);

  const update: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error('Give the inventory item a name.');
    update.name = name;
  }
  if (input.quantity !== undefined) update.quantity = Math.max(0, Math.floor(input.quantity));
  if (input.unit !== undefined) update.unit = input.unit.trim() || 'pcs';

  const { data, error } = await requireSupabase()
    .from('inventory_items')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapInventoryItem(data as Record<string, unknown>);
}

export async function deleteInventoryItem(id: string) {
  if (!isRemoteData()) return deleteMockInventoryItem(id);
  const { error } = await requireSupabase().from('inventory_items').delete().eq('id', id);
  if (error) throw error;
}

export function useInventoryQuery() {
  return useQuery({
    queryKey: inventoryQueryKey,
    queryFn: getInventory,
    staleTime: 30_000,
  });
}

function useInvalidateInventory() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: inventoryQueryKey });
}

export function useCreateInventoryItemMutation() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: createInventoryItem,
    onSuccess: invalidate,
  });
}

export function useUpdateInventoryItemMutation() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<InventoryMutationInput> }) =>
      updateInventoryItem(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteInventoryItemMutation() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: invalidate,
  });
}
