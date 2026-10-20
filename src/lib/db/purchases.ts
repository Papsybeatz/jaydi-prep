import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Purchase = {
  id: string;
  user_id: string;
  credits_granted: number;
  credits_remaining: number;
  amount_total: number;
  currency: string;
  status: string;
  created_at: string;
};

/**
 * Remaining narration credits for the signed-in user. Row-level security keeps
 * this to their own purchases.
 */
export async function getAudioCredits(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("purchases")
    .select("credits_remaining")
    .eq("status", "paid")
    .gt("credits_remaining", 0);

  if (error) {
    throw error;
  }

  return (data ?? []).reduce(
    (total, row) => total + (row.credits_remaining ?? 0),
    0,
  );
}

/**
 * Atomically spend one credit. Returns the purchase id that was charged, or
 * null when the user has none.
 */
export async function consumeAudioCredit(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("consume_audio_credit");

  if (error) {
    throw error;
  }

  return data ?? null;
}

/** Return a credit when narration fails after it was charged. */
export async function refundAudioCredit(purchaseId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("refund_audio_credit", {
    p_purchase_id: purchaseId,
  });

  if (error) {
    console.error("Could not refund an audio credit.", error);
  }
}

export async function listPurchases(): Promise<Purchase[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("purchases")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}
