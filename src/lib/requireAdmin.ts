import type { AstroCookies } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ssrClient } from './supabase';

interface AdminCheck {
  ok: boolean;
  response?: Response;
  supabase?: SupabaseClient;
  email?: string;
}

/** Guard for /admin pages. Redirects anonymous users to /login, 403s non-admins. */
export async function requireAdmin(request: Request, cookies: AstroCookies, pathname: string): Promise<AdminCheck> {
  const supabase = ssrClient(request, cookies);
  if (!supabase) {
    return { ok: false, response: new Response('Service unavailable', { status: 500 }) };
  }
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) {
    return {
      ok: false,
      response: new Response(null, { status: 303, headers: { Location: `/login?next=${encodeURIComponent(pathname)}` } }),
    };
  }
  const { data: adminRow } = await supabase.from('admins').select('email').eq('email', user.email).maybeSingle();
  if (!adminRow) {
    return { ok: false, response: new Response('Forbidden — this account does not have studio access.', { status: 403 }) };
  }
  return { ok: true, supabase, email: user.email };
}

export const EDITABLE_TABLES: Record<string, { label: string; titleCol: string; cols: { name: string; kind: 'text' | 'textarea' | 'number' | 'array' }[]; hasPublished: boolean }> = {
  pages: {
    label: 'Pages',
    titleCol: 'title',
    hasPublished: true,
    cols: [
      { name: 'slug', kind: 'text' },
      { name: 'title', kind: 'text' },
      { name: 'meta_title', kind: 'text' },
      { name: 'meta_description', kind: 'textarea' },
      { name: 'body_html', kind: 'textarea' },
    ],
  },
  classes: {
    label: 'Classes',
    titleCol: 'name',
    hasPublished: true,
    cols: [
      { name: 'slug', kind: 'text' },
      { name: 'name', kind: 'text' },
      { name: 'tagline', kind: 'text' },
      { name: 'description', kind: 'textarea' },
      { name: 'body_html', kind: 'textarea' },
      { name: 'level', kind: 'text' },
      { name: 'duration_minutes', kind: 'number' },
      { name: 'price_pence', kind: 'number' },
      { name: 'capacity', kind: 'number' },
      { name: 'image_url', kind: 'text' },
      { name: 'meta_title', kind: 'text' },
      { name: 'meta_description', kind: 'textarea' },
      { name: 'sort_order', kind: 'number' },
    ],
  },
  instructors: {
    label: 'Instructors',
    titleCol: 'name',
    hasPublished: true,
    cols: [
      { name: 'slug', kind: 'text' },
      { name: 'name', kind: 'text' },
      { name: 'title', kind: 'text' },
      { name: 'short_bio', kind: 'textarea' },
      { name: 'bio_html', kind: 'textarea' },
      { name: 'certifications', kind: 'array' },
      { name: 'specialties', kind: 'array' },
      { name: 'image_url', kind: 'text' },
      { name: 'meta_title', kind: 'text' },
      { name: 'meta_description', kind: 'textarea' },
      { name: 'sort_order', kind: 'number' },
    ],
  },
  class_sessions: {
    label: 'Schedule (sessions)',
    titleCol: 'starts_at',
    hasPublished: false,
    cols: [
      { name: 'starts_at', kind: 'text' },
      { name: 'capacity', kind: 'number' },
      { name: 'booked_count', kind: 'number' },
      { name: 'price_pence', kind: 'number' },
    ],
  },
  testimonials: {
    label: 'Testimonials',
    titleCol: 'author_name',
    hasPublished: false,
    cols: [
      { name: 'author_name', kind: 'text' },
      { name: 'author_title', kind: 'text' },
      { name: 'quote', kind: 'textarea' },
      { name: 'rating', kind: 'number' },
      { name: 'sort_order', kind: 'number' },
    ],
  },
  faqs: {
    label: 'FAQs',
    titleCol: 'question',
    hasPublished: false,
    cols: [
      { name: 'page_slug', kind: 'text' },
      { name: 'question', kind: 'text' },
      { name: 'answer_html', kind: 'textarea' },
      { name: 'sort_order', kind: 'number' },
    ],
  },
  content: {
    label: 'Blog content',
    titleCol: 'title',
    hasPublished: true,
    cols: [
      { name: 'slug', kind: 'text' },
      { name: 'title', kind: 'text' },
      { name: 'excerpt', kind: 'textarea' },
      { name: 'body', kind: 'textarea' },
      { name: 'cover_image_url', kind: 'text' },
      { name: 'seo_title', kind: 'text' },
      { name: 'seo_description', kind: 'textarea' },
    ],
  },
};
