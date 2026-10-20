import { PASS } from "@/lib/billing/config";
import { getStripe, StripeConfigurationError } from "@/lib/billing/stripe";
import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

function siteOrigin(request: Request): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return new URL(request.url).origin;
}

export async function POST(request: Request): Promise<Response> {
  let user;
  try {
    user = await getAuthenticatedUser();
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    console.error("Could not validate session for checkout.", error);
    return Response.json({ error: "Could not verify your session." }, { status: 500 });
  }

  if (!user) {
    return Response.json(
      { error: "Sign in before buying a pass." },
      { status: 401 },
    );
  }

  try {
    const stripe = getStripe();
    const origin = siteOrigin(request);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: {
        user_id: user.id,
        credits: String(PASS.credits),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: PASS.currency,
            unit_amount: PASS.priceCents,
            product_data: {
              name: PASS.name,
              description: `${PASS.credits} audio narrations. They never expire.`,
            },
          },
        },
      ],
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing/cancelled`,
    });

    if (!session.url) {
      return Response.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 },
      );
    }

    return Response.json({ url: session.url });
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    console.error("Could not create a checkout session.", error);
    return Response.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 },
    );
  }
}
