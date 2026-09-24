import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/store/authStore';
import type { MenuCategory, MenuItem, MenuMutationInput } from '@/types';
import {
  createMockCategory,
  createMockMenuItem,
  deleteMockCategory,
  deleteMockMenuItem,
  getMockMenu,
  reorderMockCategories,
  updateMockCategory,
  updateMockMenuItem,
} from './mockData';
import { requireSupabase } from './supabase';

export const menuQueryKey = ['menu'] as const;

function isRemoteData() {
  return useAuthStore.getState().dataMode === 'supabase';
}

function mapCategory(row: Record<string, unknown>): MenuCategory {
  return {
    id: String(row.id),
    name: String(row.name),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapItem(row: Record<string, unknown>): MenuItem {
  return {
    id: String(row.id),
    categoryId: String(row.category_id),
    name: String(row.name),
    description: String(row.description ?? ''),
    price: Number(row.price ?? 0),
    imageUrl: row.image_url ? String(row.image_url) : null,
    isAvailable: Boolean(row.is_available),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function getMenu() {
  if (!isRemoteData()) return getMockMenu();

  const client = requireSupabase();
  const [categoryResult, itemResult] = await Promise.all([
    client.from('menu_categories').select('*').order('sort_order'),
    client.from('menu_items').select('*').order('sort_order'),
  ]);
  if (categoryResult.error) throw categoryResult.error;
  if (itemResult.error) throw itemResult.error;

  return {
    categories: (categoryResult.data as Record<string, unknown>[]).map(mapCategory),
    items: (itemResult.data as Record<string, unknown>[]).map(mapItem),
  };
}

export async function createCategory(name: string) {
  if (!isRemoteData()) return createMockCategory(name);
  const { data, error } = await requireSupabase()
    .from('menu_categories')
    .insert({ name: name.trim() })
    .select()
    .single();
  if (error) throw error;
  return mapCategory(data as Record<string, unknown>);
}

export async function updateCategory(id: string, name: string) {
  if (!isRemoteData()) return updateMockCategory(id, name);
  const { data, error } = await requireSupabase()
    .from('menu_categories')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapCategory(data as Record<string, unknown>);
}

export async function deleteCategory(id: string) {
  if (!isRemoteData()) return deleteMockCategory(id);
  const { error } = await requireSupabase().from('menu_categories').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderCategories(orderedIds: string[]) {
  if (!isRemoteData()) return reorderMockCategories(orderedIds);
  const client = requireSupabase();
  for (const [sortOrder, id] of orderedIds.entries()) {
    const { error } = await client.from('menu_categories').update({ sort_order: sortOrder }).eq('id', id);
    if (error) throw error;
  }
}

export async function createMenuItem(input: MenuMutationInput) {
  if (!isRemoteData()) {
    const menu = await getMockMenu();
    const categoryItems = menu.items.filter((item) => item.categoryId === input.categoryId);
    return createMockMenuItem({
      ...input,
      name: input.name.trim(),
      description: input.description.trim(),
      sortOrder: categoryItems.length,
    });
  }
  const { data, error } = await requireSupabase()
    .from('menu_items')
    .insert({
      category_id: input.categoryId,
      name: input.name.trim(),
      description: input.description.trim(),
      price: input.price,
      image_url: input.imageUrl ?? null,
      is_available: input.isAvailable,
    })
    .select()
    .single();
  if (error) throw error;
  return mapItem(data as Record<string, unknown>);
}

export async function updateMenuItem(id: string, input: Partial<MenuMutationInput>) {
  if (!isRemoteData()) {
    const remoteInput: Partial<MenuItem> = {};
    if (input.categoryId !== undefined) remoteInput.categoryId = input.categoryId;
    if (input.name !== undefined) remoteInput.name = input.name.trim();
    if (input.description !== undefined) remoteInput.description = input.description.trim();
    if (input.price !== undefined) remoteInput.price = input.price;
    if (input.imageUrl !== undefined) remoteInput.imageUrl = input.imageUrl;
    if (input.isAvailable !== undefined) remoteInput.isAvailable = input.isAvailable;
    return updateMockMenuItem(id, remoteInput);
  }

  const update: Record<string, unknown> = {};
  if (input.categoryId !== undefined) update.category_id = input.categoryId;
  if (input.name !== undefined) update.name = input.name.trim();
  if (input.description !== undefined) update.description = input.description.trim();
  if (input.price !== undefined) update.price = input.price;
  if (input.imageUrl !== undefined) update.image_url = input.imageUrl;
  if (input.isAvailable !== undefined) update.is_available = input.isAvailable;

  const { data, error } = await requireSupabase()
    .from('menu_items')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapItem(data as Record<string, unknown>);
}

export async function deleteMenuItem(id: string) {
  if (!isRemoteData()) return deleteMockMenuItem(id);
  const { error } = await requireSupabase().from('menu_items').delete().eq('id', id);
  if (error) throw error;
}

export function useMenuQuery() {
  return useQuery({
    queryKey: menuQueryKey,
    queryFn: getMenu,
    staleTime: 30_000,
  });
}

function useInvalidateMenu() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: menuQueryKey });
}

export function useCreateCategoryMutation() {
  const invalidate = useInvalidateMenu();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: invalidate,
  });
}

export function useUpdateCategoryMutation() {
  const invalidate = useInvalidateMenu();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateCategory(id, name),
    onSuccess: invalidate,
  });
}

export function useDeleteCategoryMutation() {
  const invalidate = useInvalidateMenu();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: invalidate,
  });
}

export function useReorderCategoriesMutation() {
  const invalidate = useInvalidateMenu();
  return useMutation({
    mutationFn: reorderCategories,
    onSuccess: invalidate,
  });
}

export function useCreateMenuItemMutation() {
  const invalidate = useInvalidateMenu();
  return useMutation({
    mutationFn: createMenuItem,
    onSuccess: invalidate,
  });
}

export function useUpdateMenuItemMutation() {
  const invalidate = useInvalidateMenu();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MenuMutationInput> }) =>
      updateMenuItem(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteMenuItemMutation() {
  const invalidate = useInvalidateMenu();
  return useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: invalidate,
  });
}
