/**
 * Single source of truth for the legal pages and the site footer.
 */

export const LEGAL = {
  company: "Gee Oh Dee (Tech) LLC",
  product: "Jaydi",
  website: "https://www.jaydi.fit",
  effectiveDate: "October 20, 2026",
  minimumAge: 16,

  // Receives mail via forwarding. Replies come from the inbox it forwards to
  // unless a "send as" identity is configured.
  contactEmail: "info@jaydi.fit",

  governingLaw: "the Commonwealth of Virginia, United States",

  providers: [
    {
      name: "Supabase",
      role: "account authentication, database, and private file storage",
    },
    {
      name: "Vercel",
      role: "application hosting and delivery",
    },
    {
      name: "OpenAI",
      role: "generating your lecture text and narrated audio",
    },
    {
      name: "Stripe",
      role: "processing payments for a pass, and storing card details on our behalf",
    },
  ],
} as const;

/** Absolute origin used for canonical URLs and checkout return links. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || LEGAL.website).replace(
  /\/+$/,
  "",
);
