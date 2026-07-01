import type { APIRoute } from 'astro';
import { anonClient } from '../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const base = (import.meta.env.PUBLIC_SITE_URL || site?.toString() || '').replace(/\/$/, '');
  const supabase = anonClient();

  let classes: any[] = [];
  let instructors: any[] = [];
  if (supabase) {
    const [{ data: c }, { data: i }] = await Promise.all([
      supabase.from('classes').select('slug, name, description').not('published_at', 'is', null).order('sort_order'),
      supabase.from('instructors').select('slug, name, title, short_bio').not('published_at', 'is', null).order('sort_order'),
    ]);
    classes = c ?? [];
    instructors = i ?? [];
  }

  const lines = [
    '# Core & Flow Pilates',
    '',
    '> Boutique Pilates studio in Austin, TX offering mat, reformer, prenatal, and barre fusion classes with certified instructors, small class sizes, and online booking with instant confirmation.',
    '',
    'Studio: 1408 S Lamar Blvd, Suite 210, Austin, TX 78704 · (512) 555-0182 · Mon–Fri 6:00a–8:00p, Sat–Sun 8:00a–2:00p.',
    '',
    '## Key pages',
    `- [Home](${base}/): Overview of the studio, class types, and booking.`,
    `- [Class schedule](${base}/schedule): Live two-week schedule of all classes, bookable online.`,
    `- [Book a class](${base}/book): Online booking with secure Stripe payment and instant email confirmation.`,
    `- [About the studio](${base}/about): The studio's story, space, and philosophy.`,
    `- [Member stories](${base}/testimonials): Reviews from Austin members.`,
    `- [Contact](${base}/contact): Questions answered within one business day.`,
    '',
    '## Classes',
    ...classes.map((c) => `- [${c.name}](${base}/classes/${c.slug}): ${c.description}`),
    '',
    '## Instructors',
    ...instructors.map((p) => `- [${p.name}](${base}/instructors/${p.slug}): ${p.title}. ${p.short_bio}`),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
