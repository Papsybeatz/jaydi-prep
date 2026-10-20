/**
 * One-time search-cycle pass.
 *
 * The document (lecture text) is free. A pass unlocks stored audio narration.
 * Credits never expire, because a job search pauses and resumes.
 */

const env = (name: string): string => (process.env[name] || "").trim();

export const PASS = {
  priceCents: Number(env("PASS_PRICE_CENTS") || 2900),
  credits: Number(env("PASS_CREDITS") || 3),
  currency: (env("PASS_CURRENCY") || "usd").toLowerCase(),
  name: "Jaydi search-cycle pass",
} as const;

export const FREE_AUDIO_PREVIEW_CHARS = 600;

export function formatPrice(cents: number = PASS.priceCents, currency: string = PASS.currency): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function narrationLabel(count: number = PASS.credits): string {
  return count === 1 ? "1 audio narration" : `${count} audio narrations`;
}
