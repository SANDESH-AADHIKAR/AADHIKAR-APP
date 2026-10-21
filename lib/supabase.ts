import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseKey = (
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  ''
).trim();

/**
 * The publishable key is the client-side replacement for the legacy anon key.
 * Access is still controlled by Row Level Security.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Expo Router statically renders the web build in Node, where `window` is not
// available. Auth persistence must stay disabled during that render pass.
const canPersistAuth = typeof window !== 'undefined';

export const supabaseConfigError = isSupabaseConfigured
  ? null
  : 'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env and restart Expo.';

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: canPersistAuth ? AsyncStorage : undefined,
        autoRefreshToken: canPersistAuth,
        persistSession: canPersistAuth,
        detectSessionInUrl: false,
      },
    })
  : null;
