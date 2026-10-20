import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/app/legal.module.css";

export const metadata: Metadata = {
  title: "Checkout cancelled — Jaydi",
};

export default function CheckoutCancelledPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} href="/">
        ← Back to Jaydi
      </Link>

      <h1 className={styles.title}>Checkout cancelled</h1>
      <p className={styles.intro}>
        Nothing was charged. Your written lectures are still free and still in
        your history.
      </p>

      <section className={styles.section}>
        <p>
          You can <Link href="/pricing">return to pricing</Link> whenever you
          want the narrated version, or{" "}
          <Link href="/history">open a training</Link> and keep reading.
        </p>
      </section>
    </main>
  );
}
