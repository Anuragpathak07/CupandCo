import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

import type { AppUser, Role } from '@/types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.',
    );
  }
  return supabase;
}

export async function signInWithEmail(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  if (!data.user || !data.session) throw new Error('Supabase did not return a valid session.');

  const profile = await fetchUserProfile(data.user.id, data.user.email ?? email);
  return { session: data.session, user: profile };
}

export async function getStoredSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function fetchUserProfile(id: string, fallbackEmail = ''): Promise<AppUser> {
  const client = requireSupabase();
  const { data, error } = await client.from('users').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Your account is not present in the Cup & Co staff directory.');
  if (!data.role) {
    throw new Error('Your staff account is awaiting a role assignment. Ask an owner to approve access.');
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email || fallbackEmail,
    role: data.role as Role,
    createdAt: data.created_at,
    avatarUrl: data.avatar_url,
  };
}

export async function signOutSupabase() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error && error.message !== 'No session') throw error;
}
