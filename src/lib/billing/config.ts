/**
 * One-time search-cycle passes.
 *
 * The document (lecture text) is free, because anyone can paste a job
 * description into a chat window and get something similar. The paid product is
 * the narrated version you can play in the car — which a chat window cannot do.
 *
 * Tier geometry follows the compromise/decoy pattern: the entry tier sits at
 * roughly half the target, the ceiling at roughly 1.7x, and the target wins on
 * price per narration. Change the numbers here; nothing else hardcodes them.
 */

const env = (name: string): string => (process.env[name] || "").trim();

export type PassTier = {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
  tagline: string;
  /** The tier the layout should promote. */
  highlighted: boolean;
};

export const PASS_CURRENCY = (env("PASS_CURRENCY") || "usd").toLowerCase();

export const PASS_TIERS: PassTier[] = [
  {
    id: "single",
    name: "One interview",
    credits: 1,
    priceCents: 1400,
    tagline: "For the interview already on your calendar.",
    highlighted: false,
  },
  {
    id: "search",
    name: "Full search",
    credits: 3,
    priceCents: 2900,
    tagline: "One narration for each round that matters.",
    highlighted: true,
  },
  {
    id: "extended",
    name: "Extended search",
    credits: 6,
    priceCents: 4900,
    tagline: "For several companies at once, or a longer search.",
    highlighted: false,
  },
];

export const DEFAULT_TIER: PassTier =
  PASS_TIERS.find((tier) => tier.highlighted) ?? PASS_TIERS[0];

export function findTier(id?: string | null): PassTier | null {
  if (!id) {
    return null;
  }
  return PASS_TIERS.find((tier) => tier.id === id) ?? null;
}

/** Kept for the webhook's fallback values. */
export const PASS = {
  name: "Jaydi search-cycle pass",
  currency: PASS_CURRENCY,
  priceCents: DEFAULT_TIER.priceCents,
  credits: DEFAULT_TIER.credits,
} as const;

export const FREE_AUDIO_PREVIEW_CHARS = 600;

export function formatPrice(
  cents: number,
  currency: string = PASS_CURRENCY,
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function pricePerNarration(tier: PassTier): string {
  return formatPrice(Math.round(tier.priceCents / tier.credits));
}

export function narrationLabel(count: number): string {
  return count === 1 ? "1 audio narration" : `${count} audio narrations`;
}

export function cheapestPriceLabel(): string {
  return formatPrice(Math.min(...PASS_TIERS.map((tier) => tier.priceCents)));
}
