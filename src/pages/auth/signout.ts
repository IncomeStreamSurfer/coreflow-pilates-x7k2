import type { APIRoute } from 'astro';
import { ssrClient } from '../../lib/supabase';
import { siteOrigin } from '../../lib/stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const origin = siteOrigin(request);
  const supabase = ssrClient(request, cookies);
  if (supabase) await supabase.auth.signOut();
  return new Response(null, { status: 303, headers: { Location: `${origin}/` } });
};
