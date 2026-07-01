import { defineMiddleware } from 'astro:middleware';
import { ssrClient } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  // Populate locals.user for auth-aware pages (skip static assets)
  const path = context.url.pathname;
  if (path.startsWith('/admin') || path === '/login' || path.startsWith('/auth/')) {
    try {
      const supabase = ssrClient(context.request, context.cookies);
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        // @ts-expect-error locals typing kept loose in v1
        context.locals.user = data.user ?? null;
      }
    } catch {
      // @ts-expect-error locals typing kept loose in v1
      context.locals.user = null;
    }
  }

  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  return response;
});
