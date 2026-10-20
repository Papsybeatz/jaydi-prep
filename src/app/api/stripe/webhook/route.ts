import type Stripe from "stripe";
import { PASS } from "@/lib/billing/config";
import { grantFromCheckoutSession } from "@/lib/billing/grant";
import {
  getStripe,
  getWebhookSecret,
  StripeConfigurationError,
} from "@/lib/billing/stripe";
import {
  createSupabaseAdminClient,
  ServiceRoleConfigurationError,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header.", { status: 400 });
  }

  // Signature verification needs the exact raw body, so read text, never JSON.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      getWebhookSecret(),
    );
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      console.error("Stripe webhook is not configured.", error);
      return new Response("Payments are not configured.", { status: 503 });
    }
    console.error("Rejected a Stripe webhook with an invalid signature.", error);
    return new Response("Invalid signature.", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    // Acknowledge everything else so Stripe does not retry it.
    return Response.json({ received: true, ignored: event.type });
  }

  const result = grantFromCheckoutSession(
    event.data.object as Stripe.Checkout.Session,
    {
      credits: PASS.credits,
      currency: PASS.currency,
      amountCents: PASS.priceCents,
    },
  );

  if (!result.grant) {
    // Acknowledge: retrying will not change a missing id or an unpaid session.
    return Response.json({ received: true, ignored: result.reason });
  }

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("purchases").upsert(result.row, {
      // Stripe retries webhooks. The unique session id makes this idempotent
      // so a retry cannot re-credit an already-spent pass.
      onConflict: "stripe_checkout_session_id",
      ignoreDuplicates: true,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    if (error instanceof ServiceRoleConfigurationError) {
      console.error(error.message);
      return new Response(error.message, { status: 503 });
    }
    // 500 makes Stripe retry, which is what we want for a transient failure.
    console.error("Could not record a completed checkout session.", error);
    return new Response("Could not record the purchase.", { status: 500 });
  }

  return Response.json({ received: true });
}
