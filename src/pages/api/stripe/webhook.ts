import type { APIRoute } from 'astro';
import { anonClient } from '../../../lib/supabase';
import { stripeClient } from '../../../lib/stripe';
import { sendEmail } from '../../../lib/email';
import { bookingConfirmationEmail } from '../../../lib/email-templates';
import { formatPrice, formatSessionFull } from '../../../lib/format';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const stripe = stripeClient();
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET ?? '';
  if (!stripe || !webhookSecret) return new Response('not configured', { status: 500 });

  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('missing signature', { status: 400 });

  let event;
  try {
    const rawBody = await request.text();
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[webhook] signature verification failed', err);
    return new Response('invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const sessionId = session.metadata?.session_id;
    const customerName = session.metadata?.customer_name ?? 'Guest';
    const spots = parseInt(session.metadata?.spots ?? '1', 10) || 1;
    const customerEmail = session.customer_details?.email ?? session.customer_email ?? '';
    const amount = session.amount_total ?? 0;

    if (sessionId) {
      const supabase = anonClient();
      const rpcSecret = import.meta.env.BOOKING_RPC_SECRET ?? '';
      if (supabase && rpcSecret) {
        const { data, error } = await supabase.rpc('confirm_booking', {
          p_secret: rpcSecret,
          p_session_id: sessionId,
          p_stripe_session_id: session.id,
          p_customer_name: customerName,
          p_customer_email: customerEmail,
          p_spots: spots,
          p_amount_pence: amount,
        });
        if (error) {
          console.error('[webhook] confirm_booking failed', error);
          return new Response('booking write failed', { status: 500 });
        }

        // Confirmation email — best effort, only for fresh (non-duplicate) bookings
        if (customerEmail && !(data as any)?.duplicate) {
          try {
            const { data: cs } = await supabase
              .from('class_sessions')
              .select('starts_at, classes(name), instructors(name)')
              .eq('id', sessionId)
              .maybeSingle();
            const cls: any = cs ? (Array.isArray(cs.classes) ? cs.classes[0] : cs.classes) : null;
            const instr: any = cs ? (Array.isArray(cs.instructors) ? cs.instructors[0] : cs.instructors) : null;
            const siteUrl = import.meta.env.PUBLIC_SITE_URL || '';
            const tpl = bookingConfirmationEmail({
              customerName,
              className: cls?.name ?? 'your class',
              instructorName: instr?.name ?? 'our team',
              startsAt: cs ? formatSessionFull(cs.starts_at) : 'see confirmation',
              spots,
              amountFormatted: formatPrice(amount),
              reference: session.id.slice(-8).toUpperCase(),
              siteUrl,
            });
            await sendEmail({ to: customerEmail, subject: tpl.subject, html: tpl.html }).catch(() => {});
          } catch (err) {
            console.warn('[webhook] confirmation email failed', err);
          }
        }
      } else {
        console.error('[webhook] supabase/rpc secret not configured');
        return new Response('not configured', { status: 500 });
      }
    }
  }

  return new Response('ok', { status: 200 });
};
