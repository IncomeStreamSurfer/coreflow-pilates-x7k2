import type { APIRoute } from 'astro';
import { anonClient } from '../../lib/supabase';
import { hitOrReject, clientIp, spamCheck } from '../../lib/ratelimit';
import { siteOrigin } from '../../lib/stripe';
import { sendEmail } from '../../lib/email';
import { contactAckEmail } from '../../lib/email-templates';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  const ok = () => new Response(null, { status: 303, headers: { Location: `${origin}/contact?sent=1` } });
  const fail = (e: string) => new Response(null, { status: 303, headers: { Location: `${origin}/contact?error=${e}` } });

  if (!hitOrReject(`contact:${clientIp(request)}`)) return fail('rate');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail('invalid');
  }

  if (spamCheck(form).spam) return ok(); // fake success for bots

  const name = String(form.get('name') ?? '').trim().slice(0, 120);
  const email = String(form.get('email') ?? '').trim().slice(0, 200);
  const message = String(form.get('message') ?? '').trim().slice(0, 4000);
  if (!name || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('invalid');

  const supabase = anonClient();
  if (!supabase) return fail('unavailable');

  const { error } = await supabase.from('contact_messages').insert({ name, email, message });
  if (error) {
    console.error('[contact] insert failed', error);
    return fail('unavailable');
  }

  const tpl = contactAckEmail({ name, siteUrl: origin });
  sendEmail({ to: email, subject: tpl.subject, html: tpl.html }).catch(() => {});

  return ok();
};
