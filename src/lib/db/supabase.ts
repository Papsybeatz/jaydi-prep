import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Training } from "@/lib/db/trainings";

type Database = {
  public: {
    Tables: {
      trainings: {
        Row: Training;
        Insert: Omit<Training, "id" | "createdAt">;
        Update: Partial<Omit<Training, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export class SupabaseConfigurationError extends Error {
  constructor() {
    super(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.",
    );
    this.name = "SupabaseConfigurationError";
  }
}

let supabaseClient: SupabaseClient<Database> | undefined;

export function getSupabaseClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new SupabaseConfigurationError();
  }

  if (!supabaseClient) {
    supabaseClient = createClient<Database>(url, anonKey);
  }

  return supabaseClient;
}
