import type { APIRoute } from 'astro';
import { anonClient } from '../../../lib/supabase';
import { hitOrReject, clientIp, spamCheck } from '../../../lib/ratelimit';
import { siteOrigin } from '../../../lib/stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  const ok = () => new Response(null, { status: 303, headers: { Location: `${origin}/login?sent=1` } });
  const fail = (e: string) => new Response(null, { status: 303, headers: { Location: `${origin}/login?error=${e}` } });

  if (!hitOrReject(`login:${clientIp(request)}`, 5, 60_000)) return fail('rate');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail('invalid');
  }
  if (spamCheck(form).spam) return ok();

  const email = String(form.get('email') ?? '').trim().slice(0, 200);
  const next = String(form.get('next') ?? '/admin').slice(0, 200);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('invalid');

  const supabase = anonClient();
  if (!supabase) return fail('unavailable');

  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/admin';
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}` },
  });
  if (error) {
    console.error('[auth] signInWithOtp failed', error.message);
    return fail('invalid');
  }
  return ok();
};
