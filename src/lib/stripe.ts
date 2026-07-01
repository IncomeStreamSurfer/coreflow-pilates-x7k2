import Stripe from 'stripe';

export function stripeClient(): Stripe | null {
  const key = import.meta.env.STRIPE_SECRET_KEY ?? '';
  if (!key) return null;
  return new Stripe(key);
}

/** Absolute site origin — NEVER derive from request.url on Vercel SSR. */
export function siteOrigin(request: Request): string {
  const envUrl = import.meta.env.PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
  return `${proto}://${host}`;
}
