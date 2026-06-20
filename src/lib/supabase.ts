import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Global reference for the instantiated client
let supabaseClient: SupabaseClient | null = null;

/**
 * Check if we have active, valid Supabase credentials configured.
 * Checks localStorage first, and falls back to build-time Vite env variables.
 */
export function isSupabaseConfigured(): boolean {
  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_anon_key');
  if (localUrl && localKey && localUrl.startsWith('https://')) {
    return true;
  }

  const envUrl = (import.meta as any).env.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envUrl !== 'YOUR_SUPABASE_URL' && envUrl !== '' && envKey && envKey !== 'YOUR_SUPABASE_ANON_KEY' && envKey !== '') {
    return true;
  }

  return false;
}

/**
 * Lazily retrieves or builds the Supabase client instance.
 */
export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_anon_key');
  if (localUrl && localKey && localUrl.startsWith('https://')) {
    supabaseClient = createClient(localUrl, localKey);
    return supabaseClient;
  }

  const envUrl = (import.meta as any).env.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envUrl !== 'YOUR_SUPABASE_URL' && envUrl !== '' && envKey && envKey !== 'YOUR_SUPABASE_ANON_KEY' && envKey !== '') {
    supabaseClient = createClient(envUrl, envKey);
    return supabaseClient;
  }

  return null;
}

/**
 * Programmatically update configuration (e.g. from server API or manually entered)
 */
export function setSupabaseConfig(url: string, key: string): SupabaseClient | null {
  if (!url || !key || !url.startsWith('https://')) return null;
  localStorage.setItem('supabase_url', url.trim());
  localStorage.setItem('supabase_anon_key', key.trim());
  supabaseClient = createClient(url.trim(), key.trim());
  return supabaseClient;
}

/**
 * Remove Supabase configuration credentials
 */
export function clearSupabaseConfig(): void {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_anon_key');
  supabaseClient = null;
}

/**
 * ES6 Proxy fallback. If any component imports `{ supabase }` and calls dynamic properties (e.g., supabase.auth.onAuthStateChange), 
 * it will lazily fetch the client or throw a clear, friendly error instead of crashing the runtime bundle evaluation.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop, receiver) {
    const client = getSupabase();
    if (!client) {
      // Return a stub to prevent immediate crashes during mount, if they are resolved safely in App.tsx
      if (prop === 'auth') {
        return {
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        };
      }
      throw new Error("Supabase is not configured yet. Please configure it in the Setup panel first.");
    }
    return Reflect.get(client, prop, receiver);
  }
});

