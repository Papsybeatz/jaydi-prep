import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

export class ServiceRoleConfigurationError extends Error {
  constructor() {
    super(
      "SUPABASE_SERVICE_ROLE_KEY is not set. The Stripe webhook needs it to record purchases.",
    );
    this.name = "ServiceRoleConfigurationError";
  }
}

/**
 * Bypasses row-level security. Only for the Stripe webhook, which runs without
 * a user session. Never expose this client or its key to the browser.
 */
export function createSupabaseAdminClient() {
  const { url } = getSupabaseConfig();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!key) {
    throw new ServiceRoleConfigurationError();
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
