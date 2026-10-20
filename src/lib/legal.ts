/**
 * Single source of truth for the legal pages and the site footer.
 *
 * TODO before public launch — replace these placeholder values:
 *   - contactEmail: a real, monitored inbox
 *
 * governingLaw is set to Virginia.
 */

export const LEGAL = {
  company: "Gee Oh Dee (Tech) LLC",
  product: "Jaydi",
  effectiveDate: "October 20, 2026",
  minimumAge: 16,

  // PLACEHOLDER — replace with a real, monitored support address.
  contactEmail: "support@example.com",

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
  ],
} as const;
