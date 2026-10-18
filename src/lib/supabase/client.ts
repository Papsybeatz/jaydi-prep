"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

let supabaseBrowserClient:
  | ReturnType<typeof createBrowserClient<Database>>
  | undefined;

export function createSupabaseBrowserClient() {
  if (!supabaseBrowserClient) {
    const { url, anonKey } = getSupabaseConfig();
    supabaseBrowserClient = createBrowserClient<Database>(url, anonKey);
  }

  return supabaseBrowserClient;
}
