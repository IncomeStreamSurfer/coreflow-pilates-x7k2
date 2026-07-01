import type { APIRoute } from 'astro';
import { anonClient } from '../../lib/supabase';
import { stripeClient, siteOrigin } from '../../lib/stripe';
import { spamCheck } from '../../lib/ratelimit';
import { formatSessionFull } from '../../lib/format';

export const prerender = false;

const redirect = (origin: string, error: string) =>
  new Response(null, { status: 303, headers: { Location: `${origin}/book?error=${error}` } });

export const POST: APIRoute = async ({ request }) => {
  const origin = siteOrigin(request);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirect(origin, 'invalid');
  }

  // Honeypot + timing: fake success for bots
  if (spamCheck(form).spam) {
    return new Response(null, { status: 303, headers: { Location: `${origin}/checkout/success` } });
  }

  const sessionId = String(form.get('session_id') ?? '').trim();
  const name = String(form.get('name') ?? '').trim().slice(0, 120);
  const email = String(form.get('email') ?? '').trim().slice(0, 200);
  const spots = Math.min(3, Math.max(1, parseInt(String(form.get('spots') ?? '1'), 10) || 1));

  if (!sessionId || !name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return redirect(origin, 'invalid');
  }

  const supabase = anonClient();
  const stripe = stripeClient();
  if (!supabase || !stripe) return redirect(origin, 'unavailable');

  // Server-side price lookup — never trust the client
  const { data: session, error } = await supabase
    .from('class_sessions')
    .select('id, starts_at, capacity, booked_count, canceled, price_pence, classes(name, slug, price_pence, duration_minutes), instructors(name)')
    .eq('id', sessionId)
    .maybeSingle();

  if (error || !session || session.canceled) return redirect(origin, 'invalid');
  if (new Date(session.starts_at).getTime() < Date.now()) return redirect(origin, 'invalid');
  if (session.capacity - session.booked_count < spots) return redirect(origin, 'full');

  const cls: any = Array.isArray(session.classes) ? session.classes[0] : session.classes;
  const instructor: any = Array.isArray(session.instructors) ? session.instructors[0] : session.instructors;
  const unitAmount = session.price_pence ?? cls?.price_pence;
  if (!unitAmount || unitAmount < 50) return redirect(origin, 'unavailable');

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          quantity: spots,
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: `${cls?.name} — ${formatSessionFull(session.starts_at)}`,
              description: `${cls?.duration_minutes ?? 50} min class with ${instructor?.name ?? 'our instructors'} at Core & Flow Pilates, Austin`,
              metadata: { session_id: session.id, class_slug: cls?.slug ?? '' },
            },
          },
        },
      ],
      metadata: {
        session_id: session.id,
        customer_name: name,
        spots: String(spots),
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
    });
    if (!checkout.url) return redirect(origin, 'unavailable');
    return new Response(null, { status: 303, headers: { Location: checkout.url } });
  } catch (err) {
    console.error('[checkout] stripe error', err);
    return redirect(origin, 'unavailable');
  }
};
