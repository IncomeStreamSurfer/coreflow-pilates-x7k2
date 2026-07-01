import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

const url = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE ?? '';

/** Public, RLS-enforced client. Null when env is missing. */
export function anonClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

/** Server-only privileged client. Null when env is missing. */
export function serviceClient(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/** Cookie-backed SSR client for auth flows. Null when env is missing. */
export function ssrClient(request: Request, cookies: AstroCookies): SupabaseClient | null {
  if (!url || !anonKey) return null;
  const header = request.headers.get('cookie') ?? '';
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return header
          .split(';')
          .map((c) => c.trim())
          .filter(Boolean)
          .map((c) => {
            const idx = c.indexOf('=');
            return { name: c.slice(0, idx), value: decodeURIComponent(c.slice(idx + 1)) };
          });
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, { path: '/', ...options });
        });
      },
    },
  });
}
