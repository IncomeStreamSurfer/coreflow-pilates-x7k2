const ACCENT = '#5c6f52';
const PAPER = '#faf6f0';
const INK = '#26291f';

function layout(preheader: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:${PAPER};font-family:Georgia,serif;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="padding:0 8px 20px;">
  <span style="font-size:20px;color:${INK};letter-spacing:-0.02em;">Core <span style="color:${ACCENT};">&amp;</span> Flow Pilates</span>
</td></tr>
<tr><td style="background:#ffffff;border:1px solid #e5ded2;border-radius:10px;padding:32px;">
${body}
</td></tr>
<tr><td style="padding:20px 8px;font-size:12px;color:#8a8474;font-family:Helvetica,Arial,sans-serif;">
  Core &amp; Flow Pilates · 1408 S Lamar Blvd, Suite 210, Austin, TX 78704<br/>
  <a href="${process.env.PUBLIC_SITE_URL || '#'}" style="color:${ACCENT};">coreflow-pilates</a> · (512) 555-0182
</td></tr>
</table>
</td></tr></table></body></html>`;
}

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:${ACCENT};color:#faf6f0;text-decoration:none;padding:12px 26px;border-radius:999px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;">${label}</a>`;

const p = (text: string) =>
  `<p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#44483a;">${text}</p>`;

const h = (text: string) =>
  `<h1 style="margin:0 0 18px;font-size:26px;line-height:1.15;color:${INK};font-weight:500;">${text}</h1>`;

export function bookingConfirmationEmail(args: {
  customerName: string;
  className: string;
  instructorName: string;
  startsAt: string; // pre-formatted human string
  spots: number;
  amountFormatted: string;
  reference: string;
  siteUrl: string;
}): { subject: string; html: string } {
  const body = [
    h(`You're booked, ${args.customerName.split(' ')[0]}.`),
    p(`Your spot in <strong>${args.className}</strong> with ${args.instructorName} is confirmed.`),
    `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:${PAPER};border-radius:8px;margin:0 0 18px;">
      <tr><td style="padding:18px 20px;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#44483a;line-height:1.9;">
        <strong style="color:${INK};">When:</strong> ${args.startsAt}<br/>
        <strong style="color:${INK};">Where:</strong> 1408 S Lamar Blvd, Suite 210, Austin, TX 78704<br/>
        <strong style="color:${INK};">Spots:</strong> ${args.spots}<br/>
        <strong style="color:${INK};">Paid:</strong> ${args.amountFormatted}<br/>
        <strong style="color:${INK};">Reference:</strong> ${args.reference}
      </td></tr></table>`,
    p(`Arrive five minutes early, bring water and grip socks (or grab a pair at the desk for $8). Free parking behind the building.`),
    p(`Need to reschedule? Reply to this email at least 12 hours before class.`),
    btn(`${args.siteUrl}/schedule`, 'View the schedule'),
  ].join('');
  return { subject: `Confirmed: ${args.className} · ${args.startsAt}`, html: layout(`Your ${args.className} booking is confirmed`, body) };
}

export function contactAckEmail(args: { name: string; siteUrl: string }): { subject: string; html: string } {
  const body = [
    h(`Got it, ${args.name.split(' ')[0]}.`),
    p(`Thanks for reaching out to Core &amp; Flow — a human (usually Maria) will reply within one business day.`),
    p(`In the meantime, this week's classes are open for booking.`),
    btn(`${args.siteUrl}/book`, 'Book a class'),
  ].join('');
  return { subject: `We got your message — Core & Flow Pilates`, html: layout('We received your message', body) };
}
