"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "../page.module.css";

export default function AccountControls() {
  const hasSupabaseConfiguration = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(hasSupabaseConfiguration);
  const [error, setError] = useState(
    hasSupabaseConfiguration
      ? ""
      : "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.",
  );

  useEffect(() => {
    if (!hasSupabaseConfiguration) return;

    let active = true;
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      setIsLoading(false);
      if (authError && !isAuthSessionMissingError(authError)) {
        setError("Could not check your account.");
      } else {
        setEmail(data.user?.email ?? null);
      }
    }, () => {
      if (active) {
        setIsLoading(false);
        setError("Could not check your account.");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setEmail(session?.user.email ?? null);
        setIsLoading(false);
        setError("");
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [hasSupabaseConfiguration]);

  async function signOut() {
    setError("");
    try {
      const { error: signOutError } =
        await createSupabaseBrowserClient().auth.signOut();
      if (signOutError) throw signOutError;
    } catch {
      setError("Could not sign out. Please try again.");
    }
  }

  return (
    <section className={styles.accountSection} aria-label="My account">
      <p className={styles.sideSectionTitle}>MY ACCOUNT</p>
      {isLoading ? (
        <p className={styles.accountStatus}>Checking session…</p>
      ) : email ? (
        <>
          <p className={styles.accountEmail} title={email}>{email}</p>
          <button className={styles.accountButton} type="button" onClick={signOut}>
            Sign out
          </button>
        </>
      ) : (
        <Link className={styles.accountButton} href="/auth">
          Sign in or create account
        </Link>
      )}
      {error && <p className={styles.accountError} role="alert">{error}</p>}
    </section>
  );
}
