import type { Metadata } from "next";
import Link from "next/link";
import { PASS, formatPrice, narrationLabel } from "@/lib/billing/config";
import { isPaymentsConfigured } from "@/lib/billing/stripe";
import { getAudioCredits } from "@/lib/db/purchases";
import styles from "@/app/legal.module.css";
import PurchaseButton from "./purchase-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Pricing — ${PASS.name.replace("Jaydi ", "")}`,
  description:
    "The written interview lecture is free. A one-time search-cycle pass adds narrated audio you can download and play in the car.",
};

async function remainingCredits(): Promise<number | null> {
  try {
    return await getAudioCredits();
  } catch {
    return null;
  }
}

export default async function PricingPage() {
  const credits = await remainingCredits();
  const paymentsReady = isPaymentsConfigured();

  return (
    <main className={styles.page}>
      <Link className={styles.back} href="/">
        ← Back to Jaydi
      </Link>

      <h1 className={styles.title}>Pricing</h1>
      <p className={styles.updated}>Pay once. No subscription.</p>
      <p className={styles.intro}>
        The written lecture is free and stays free. A pass adds the narrated
        audio — the version you can play on the way to the interview instead of
        reading at a desk.
      </p>

      {credits !== null && credits > 0 && (
        <div className={styles.note}>
          You have <b>{narrationLabel(credits)}</b> available on this account.
        </div>
      )}

      <section className={styles.section}>
        <h2>Free</h2>
        <ul>
          <li>Upload or paste your resume, and paste any job description.</li>
          <li>
            A full written lecture for that specific role — understanding the
            role, resume versus role, skill gaps, how to think and speak in the
            role, interview strategy, and embodiment exercises.
          </li>
          <li>Unlimited trainings, saved to your private history.</li>
          <li>A 30-second audio preview of any lecture.</li>
        </ul>
        <p>
          No card, no trial clock. The document is yours whether or not you ever
          buy a pass.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Search-cycle pass — {formatPrice()}</h2>
        <p>
          One payment, <b>{narrationLabel()}</b>, credited to your account.
          Credits do not expire, because a job search pauses and picks back up.
        </p>
        <ul>
          <li>Narrated audio for {PASS.credits} trainings of your choice.</li>
          <li>
            Downloadable MP3, so it plays in the car, offline, on any device.
          </li>
          <li>Use them across different roles and companies.</li>
          <li>If narration fails, the credit is automatically returned.</li>
        </ul>

        {paymentsReady ? (
          <div style={{ marginTop: 18 }}>
            <PurchaseButton
              label={`Get ${narrationLabel()} — ${formatPrice()}`}
            />
            <p style={{ color: "#586158", fontSize: 14, margin: "12px 0 0" }}>
              Checkout is handled by Stripe. You will be returned here
              afterwards.
            </p>
          </div>
        ) : (
          <div className={styles.note}>
            Payments are not configured on this deployment yet. Set{" "}
            <code>STRIPE_SECRET_KEY</code>, <code>STRIPE_WEBHOOK_SECRET</code>{" "}
            and <code>SUPABASE_SERVICE_ROLE_KEY</code> to enable checkout.
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2>Why not a subscription?</h2>
        <p>
          Interview prep is not a monthly habit. Most people need it once, or a
          handful of times, until they land the role — then they stop. A
          subscription would charge you for months you are not preparing. A
          pass matches how the work actually happens.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Questions</h2>
        <h3>Do credits expire?</h3>
        <p>No. They stay on your account until you use them.</p>
        <h3>What if I run out?</h3>
        <p>
          Buy another pass whenever you need one. Nothing renews on its own, so
          there is nothing to cancel.
        </p>
        <h3>What happens to my written lectures?</h3>
        <p>
          They remain in your history and stay readable, whether or not you have
          a pass.
        </p>
      </section>

      <p className={styles.footerNote}>
        See our <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </main>
  );
}
