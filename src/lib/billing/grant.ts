/**
 * Pure mapping from a Stripe Checkout Session to a `purchases` row.
 *
 * Kept free of SDK and database imports so the grant rules can be tested
 * directly. The webhook route only does I/O around this.
 */

export type CheckoutSessionLike = {
  id: string;
  payment_status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  payment_intent?: string | { id: string } | null;
  customer?: string | { id: string } | null;
  metadata?: Record<string, string> | null;
  client_reference_id?: string | null;
};

export type PurchaseInsert = {
  user_id: string;
  stripe_checkout_session_id: string;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  amount_total: number;
  currency: string;
  credits_granted: number;
  credits_remaining: number;
  status: string;
};

export type GrantResult =
  | { grant: true; row: PurchaseInsert }
  | { grant: false; reason: string };

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return typeof value === "string" ? value : value.id;
}

export function grantFromCheckoutSession(
  session: CheckoutSessionLike,
  defaults: { credits: number; currency: string; amountCents: number },
): GrantResult {
  const userId = session.metadata?.user_id ?? session.client_reference_id ?? null;

  if (!userId) {
    return { grant: false, reason: "missing_user_id" };
  }

  // Asynchronous payment methods settle later, so only a paid session grants.
  if (session.payment_status !== "paid") {
    return { grant: false, reason: `payment_${session.payment_status ?? "unknown"}` };
  }

  const parsedCredits = Number(session.metadata?.credits);
  const credits =
    Number.isFinite(parsedCredits) && parsedCredits > 0
      ? Math.floor(parsedCredits)
      : defaults.credits;

  return {
    grant: true,
    row: {
      user_id: userId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: idOf(session.payment_intent),
      stripe_customer_id: idOf(session.customer),
      amount_total:
        typeof session.amount_total === "number"
          ? session.amount_total
          : defaults.amountCents,
      currency: session.currency ?? defaults.currency,
      credits_granted: credits,
      credits_remaining: credits,
      status: "paid",
    },
  };
}
