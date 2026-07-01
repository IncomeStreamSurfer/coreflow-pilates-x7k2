export function formatPrice(pence: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: pence % 100 === 0 ? 0 : 2 }).format(pence / 100);
}

const TZ = 'America/Chicago';

export function formatSessionDay(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: TZ }).format(new Date(iso));
}

export function formatSessionTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ }).format(new Date(iso)).toLowerCase().replace(' ', '');
}

export function formatSessionFull(iso: string): string {
  return `${formatSessionDay(iso)} at ${formatSessionTime(iso)}`;
}

export function dayKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: TZ }).format(new Date(iso));
}
