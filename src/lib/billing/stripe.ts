import "server-only";

import Stripe from "stripe";

let cached: Stripe | null = null;

export class StripeConfigurationError extends Error {
  constructor() {
    super("Payments are not configured. Set STRIPE_SECRET_KEY in your environment.");
    this.name = "StripeConfigurationError";
  }
}

export function getStripe(): Stripe {
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) {
    throw new StripeConfigurationError();
  }
  if (!cached) {
    cached = new Stripe(key, { appInfo: { name: "Jaydi", version: "1.0.0" } });
  }
  return cached;
}

export function getWebhookSecret(): string {
  const secret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  if (!secret) {
    throw new StripeConfigurationError();
  }
  return secret;
}

export function isPaymentsConfigured(): boolean {
  return Boolean((process.env.STRIPE_SECRET_KEY || "").trim());
}
