import type { APIRoute } from 'astro';
import { ssrClient } from '../../lib/supabase';
import { siteOrigin } from '../../lib/stripe';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const origin = siteOrigin(request);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next') ?? '/admin';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/admin';

  if (code) {
    const supabase = ssrClient(request, cookies);
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return new Response(null, { status: 303, headers: { Location: `${origin}${next}` } });
      }
      console.error('[auth] code exchange failed', error.message);
    }
  }
  return new Response(null, { status: 303, headers: { Location: `${origin}/login?error=invalid` } });
};
