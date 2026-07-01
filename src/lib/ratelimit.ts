const hits = new Map<string, number[]>();

/** Simple in-memory sliding-window rate limit. Returns true when ALLOWED. */
export function hitOrReject(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  return true;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/** Anti-spam checks shared by all public forms: honeypot + timing. */
export function spamCheck(form: FormData): { spam: boolean } {
  const honeypot = String(form.get('website') ?? '');
  if (honeypot.trim() !== '') return { spam: true };
  const renderedAt = Number(form.get('renderedAt') ?? 0);
  const age = Date.now() - renderedAt;
  if (!renderedAt || age < 3_000 || age > 86_400_000) return { spam: true };
  return { spam: false };
}
