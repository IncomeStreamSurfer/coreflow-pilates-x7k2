interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export async function sendEmail(args: SendEmailArgs): Promise<{ ok: boolean; id?: string }> {
  const apiKey = import.meta.env.RESEND_API_KEY ?? '';
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY missing — skipping send:', args.subject);
    return { ok: false };
  }
  const from = import.meta.env.EMAIL_FROM || 'Core & Flow Pilates <onboarding@resend.dev>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: Array.isArray(args.to) ? args.to : [args.to],
        subject: args.subject,
        html: args.html,
        text: args.text,
        reply_to: args.replyTo,
        tags: args.tags,
      }),
    });
    if (!res.ok) {
      console.warn('[email] send failed', res.status, await res.text().catch(() => ''));
      return { ok: false };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    console.warn('[email] send error', err);
    return { ok: false };
  }
}
