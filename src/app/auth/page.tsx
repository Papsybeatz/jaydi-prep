"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./auth.module.css";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams?.get("next") ?? null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.";
    }
    return searchParams?.get("error") === "confirmation"
      ? "We couldn’t confirm that link. Please try signing in or creating your account again."
      : "";
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return () => {
        active = false;
      };
    }
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error && !isAuthSessionMissingError(error)) {
        setErrorMessage("We couldn’t check your session. Please try again.");
      } else if (data.user) {
        router.replace(nextPath);
      }
    }, () => {
      if (active) {
        setErrorMessage("We couldn’t check your session. Please try again.");
      }
    });

    return () => {
      active = false;
    };
  }, [nextPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        });

        if (error) throw error;
        if (!data.session) {
          setStatusMessage(
            "Check your email for a confirmation link to finish creating your account.",
          );
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (authError) {
      setErrorMessage(
        authError instanceof Error
          ? authError.message
          : "Authentication failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="auth-title">
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>✦</span>
          jaydi<span>.</span>
        </Link>
        <p className={styles.eyebrow}>YOUR INTERVIEW COACH</p>
        <h1 id="auth-title">{isSignUp ? "Create your account" : "Welcome back"}</h1>
        <p className={styles.description}>
          {isSignUp
            ? "Save your training privately and pick up whenever you’re ready."
            : "Sign in to continue to your private training workspace."}
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}
          {statusMessage && <p className={styles.status} role="status">{statusMessage}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait…"
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className={styles.switchMode}>
          {isSignUp ? "Already have an account?" : "New to Jaydi?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp((current) => !current);
              setErrorMessage("");
              setStatusMessage("");
            }}
          >
            {isSignUp ? "Sign in" : "Create an account"}
          </button>
        </p>
        <Link className={styles.backLink} href="/">Back to Jaydi</Link>
      </section>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<main className={styles.page}><p>Loading…</p></main>}>
      <AuthForm />
    </Suspense>
  );
}
