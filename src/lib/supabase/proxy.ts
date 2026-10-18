import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getSupabaseConfig,
  SupabaseConfigurationError,
} from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export async function updateSupabaseSession(request: NextRequest) {
  let config: ReturnType<typeof getSupabaseConfig>;
  try {
    config = getSupabaseConfig();
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return NextResponse.next({ request });
    }
    throw error;
  }
  const { url, anonKey } = config;
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}
