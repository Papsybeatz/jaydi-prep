import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/app/legal.module.css";

export const metadata: Metadata = {
  title: "Pass confirmed — Jaydi",
};

export default function CheckoutSuccessPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} href="/">
        ← Back to Jaydi
      </Link>

      <h1 className={styles.title}>Payment received</h1>
      <p className={styles.intro}>
        Your search-cycle pass is being added to your account now. Open a
        training and the narrated version will be available.
      </p>

      <div className={styles.note}>
        Activation is confirmed by Stripe and usually takes a few seconds. If a
        lecture still shows audio as locked, wait a moment and refresh this
        page — your payment has already gone through.
      </div>

      <section className={styles.section}>
        <p>
          <Link href="/history">Go to your training history</Link> to pick a
          lecture, or <Link href="/">start a new training</Link>.
        </p>
      </section>

      <p className={styles.footerNote}>
        Questions about this purchase? See our{" "}
        <Link href="/terms">Terms of Service</Link>.
      </p>
    </main>
  );
}
