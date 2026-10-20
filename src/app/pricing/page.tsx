import type { Metadata } from "next";
import Link from "next/link";
import {
  DEFAULT_TIER,
  PASS_TIERS,
  formatPrice,
  narrationLabel,
  pricePerNarration,
} from "@/lib/billing/config";
import { isPaymentsConfigured } from "@/lib/billing/stripe";
import { getAudioCredits } from "@/lib/db/purchases";
import styles from "@/app/legal.module.css";
import PurchaseButton from "./purchase-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing — Jaydi",
  description:
    "The written interview lecture is free. A one-time pass adds narrated audio you can download and play in the car.",
};

async function remainingCredits(): Promise<number | null> {
  try {
    return await getAudioCredits();
  } catch {
    return null;
  }
}

const card: React.CSSProperties = {
  border: "1px solid #e0e5de",
  borderRadius: 14,
  display: "flex",
  flexDirection: "column",
  padding: "22px 20px",
};

export default async function PricingPage() {
  const credits = await remainingCredits();
  const paymentsReady = isPaymentsConfigured();

  return (
    <main className={styles.page} style={{ maxWidth: 920 }}>
      <Link className={styles.back} href="/">
        ← Back to Jaydi
      </Link>

      <h1 className={styles.title}>Pricing</h1>
      <p className={styles.updated}>Pay once. No subscription, nothing renews.</p>
      <p className={styles.intro}>
        The written lecture is free and always will be. A pass adds the narrated
        version — the one you can play in the car on the way to the interview.
      </p>

      {credits !== null && credits > 0 && (
        <div className={styles.note}>
          You have <b>{narrationLabel(credits)}</b> available on this account.
        </div>
      )}

      <section className={styles.section}>
        <h2>Free, forever</h2>
        <ul>
          <li>Upload a resume and paste any job description.</li>
          <li>
            A full written lecture for that specific role: understanding the
            role, resume versus role, skill gaps, how to think and speak in the
            role, interview strategy, and embodiment exercises.
          </li>
          <li>Unlimited trainings, saved to your private history.</li>
          <li>A 30-second audio preview of any lecture.</li>
        </ul>
        <p>
          No card, no trial clock. The document is yours whether or not you ever
          buy anything.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Passes</h2>
        <p style={{ marginBottom: 20 }}>
          One payment. Credits land on your account and never expire.
        </p>

        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {PASS_TIERS.map((tier) => {
            const featured = tier.highlighted;
            return (
              <div
                key={tier.id}
                style={{
                  ...card,
                  background: featured ? "#f6f8f5" : "#fff",
                  border: featured ? "2px solid #1f2a1f" : card.border,
                  boxShadow: featured ? "0 6px 20px rgba(31,42,31,0.08)" : undefined,
                }}
              >
                {featured && (
                  <span
                    style={{
                      alignSelf: "flex-start",
                      background: "#1f2a1f",
                      borderRadius: 999,
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      marginBottom: 12,
                      padding: "5px 10px",
                      textTransform: "uppercase",
                    }}
                  >
                    Most chosen
                  </span>
                )}

                <h3 style={{ fontSize: 17, margin: "0 0 4px" }}>{tier.name}</h3>
                <p style={{ color: "#586158", fontSize: 14, margin: "0 0 14px" }}>
                  {narrationLabel(tier.credits)}
                </p>

                <p style={{ fontSize: 32, fontWeight: 700, margin: "0 0 2px" }}>
                  {formatPrice(tier.priceCents)}
                </p>
                <p style={{ color: "#586158", fontSize: 13, margin: "0 0 14px" }}>
                  {tier.credits > 1
                    ? `${pricePerNarration(tier)} per narration`
                    : "one-time"}
                </p>

                <p style={{ color: "#4a544a", fontSize: 14, margin: "0 0 18px" }}>
                  {tier.tagline}
                </p>

                <div style={{ marginTop: "auto" }}>
                  <PurchaseButton
                    passId={tier.id}
                    label={`Choose ${tier.name}`}
                    variant={featured ? "primary" : "quiet"}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {paymentsReady ? (
          <p style={{ color: "#586158", fontSize: 14, marginTop: 16 }}>
            Checkout is handled by Stripe. Credits are added to your account as
            soon as payment is confirmed.
          </p>
        ) : (
          <div className={styles.note}>
            Payments are not configured on this deployment yet. Set{" "}
            <code>STRIPE_SECRET_KEY</code>, <code>STRIPE_WEBHOOK_SECRET</code>{" "}
            and <code>SUPABASE_SERVICE_ROLE_KEY</code> to enable checkout.
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2>What that price is measured against</h2>
        <p>
          Preparation has a market rate. A pass is priced to be an obvious
          rounding error next to it.
        </p>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>What you would otherwise buy</th>
              <th>Typical price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>One hour with a career coach</td>
              <td>$100–$200</td>
            </tr>
            <tr>
              <td>One mock interview with an ex-interviewer</td>
              <td>$125–$400 per session</td>
            </tr>
            <tr>
              <td>An AI interview tool subscription</td>
              <td>$25–$90 per month</td>
            </tr>
            <tr>
              <td>
                <b>A Jaydi pass</b>
              </td>
              <td>
                <b>{formatPrice(DEFAULT_TIER.priceCents)}, once</b>
              </td>
            </tr>
          </tbody>
        </table>
        <p style={{ color: "#586158", fontSize: 14 }}>
          Ranges reflect commonly published rates for coaching and mock
          interviews. Your own coach may charge differently.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Why the written lecture is free</h2>
        <p>
          Because you could paste the job description into a chat window and get
          something similar for nothing. Pretending otherwise would be dishonest,
          so the document is free here — genuinely, not as a teaser.
        </p>
        <p>
          What a chat window cannot do is give you a finished narration you can
          play on the drive to the interview, offline, without scrolling. That is
          the thing worth paying for, and it is the only thing you are paying
          for.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Why not a subscription</h2>
        <p>
          Interview prep is not a monthly habit. Most people need it once, or a
          handful of times, until they land the role — then they stop. A
          subscription would bill you for months you are not preparing. Passes
          match how the work actually happens.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Questions</h2>
        <h3>Do credits expire?</h3>
        <p>No. They stay on your account until you use them.</p>
        <h3>Can I use one pass across different companies?</h3>
        <p>
          Yes. A narration is one training for one role, and you choose which.
        </p>
        <h3>What if narration fails?</h3>
        <p>
          The credit is returned automatically, so a provider outage never costs
          you a pass.
        </p>
        <h3>What if I run out?</h3>
        <p>
          Buy another pass when you need one. Nothing renews on its own, so there
          is nothing to cancel.
        </p>
        <h3>What happens to my written lectures?</h3>
        <p>
          They stay in your history and remain readable, whether or not you have
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
