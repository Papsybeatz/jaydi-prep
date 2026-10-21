import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";
import styles from "@/app/legal.module.css";

export const metadata: Metadata = {
  title: `Privacy Policy — ${LEGAL.product}`,
  description: `How ${LEGAL.product} collects, uses, stores, and deletes your resume, job description, and generated training content.`,
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} href="/">
        ← Back to {LEGAL.product}
      </Link>

      <h1 className={styles.title}>Privacy Policy</h1>
      <p className={styles.updated}>Effective {LEGAL.effectiveDate}</p>
      <p className={styles.intro}>
        {LEGAL.product} turns your resume and a job description into an
        interview-preparation lecture, with optional narrated audio. This policy
        explains what we collect, why we collect it, who processes it, and how
        you can have it deleted. It is written to describe what the product
        actually does — not what it might do one day.
      </p>

      <section className={styles.section}>
        <h2>1. Who we are</h2>
        <p>
          {LEGAL.product} is operated by {LEGAL.company}. This policy applies to
          the service at {LEGAL.website}. We are the controller of the personal
          information described in this policy. You can reach us at{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. What we collect</h2>

        <h3>Account information</h3>
        <ul>
          <li>Your email address, which identifies your account.</li>
          <li>
            Your password. We never see or store it in readable form — it is
            hashed by our authentication provider.
          </li>
          <li>
            A session cookie that keeps you signed in between page loads.
          </li>
        </ul>

        <h3>Content you provide</h3>
        <ul>
          <li>
            <b>Resume text.</b> When you upload a PDF or DOCX, the file is parsed
            in memory to extract its text. The file itself is not stored. The
            extracted text is saved to your account when you generate a
            training.
          </li>
          <li>
            <b>Job description text.</b> Saved to your account when you generate
            a training.
          </li>
          <li>
            <b>Generated lecture text and narrated audio.</b> Created for you and
            saved to your training history.
          </li>
        </ul>

        <h3>Purchase information</h3>
        <ul>
          <li>
            When you buy a pass we store the Stripe session identifier, the
            amount paid, and how many narrations you have left. We never receive
            or store your card number.
          </li>
        </ul>

        <h3>Technical information</h3>
        <ul>
          <li>
            Standard server logs (such as request times and error records) that
            our hosting provider keeps for security and reliability.
          </li>
        </ul>

        <div className={styles.note}>
          <b>What we do not collect.</b> We do not run advertising trackers, we
          do not use third-party analytics, we do not sell or rent your
          information, and we do not use your resume or job descriptions to
          train AI models.
        </div>
      </section>

      <section className={styles.section}>
        <h2>3. How we use your information</h2>
        <ul>
          <li>To generate your lecture and narrated audio.</li>
          <li>To save your trainings so you can revisit them.</li>
          <li>To sign you in and keep your account secure.</li>
          <li>To detect abuse, prevent unauthorized access, and manage cost.</li>
          <li>To process a pass purchase and track the narrations on it.</li>
          <li>To respond to you when you contact us.</li>
        </ul>
        <p>
          We do not use your content for marketing, profiling, or any purpose
          beyond providing the service to you.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Who processes your information</h2>
        <p>
          We rely on a small number of service providers. They process your
          information only on our instructions and only to provide their service
          to us.
        </p>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Provider</th>
              <th>What they do</th>
            </tr>
          </thead>
          <tbody>
            {LEGAL.providers.map((provider) => (
              <tr key={provider.name}>
                <td>{provider.name}</td>
                <td>{provider.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.note}>
          <b>Please note:</b> to generate a lecture and its audio, the text of
          your resume and the job description is sent to OpenAI for processing.
          If you are not comfortable with that, please do not submit those
          documents.
        </div>
        <div className={styles.note}>
          <b>Payments.</b> If you buy a pass, Stripe processes the payment. We
          receive confirmation that it succeeded and the amount, but we never
          receive or store your card number.
        </div>
      </section>

      <section className={styles.section}>
        <h2>5. How long we keep it</h2>
        <ul>
          <li>
            <b>Trainings</b> (resume text, job description, lecture, audio) are
            kept until you delete them or ask us to delete your account.
          </li>
          <li>
            <b>Uploaded files</b> are not retained at all — they exist only while
            your resume is being parsed.
          </li>
          <li>
            <b>Account records</b> are kept while your account is open, then
            removed when your account is deleted.
          </li>
          <li>
            <b>Server logs</b> are kept for a short period by our hosting
            provider for security and troubleshooting.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>6. How we protect it</h2>
        <ul>
          <li>Data is encrypted in transit.</li>
          <li>
            Your trainings are protected by row-level security: the database
            itself enforces that an account can only read its own rows.
          </li>
          <li>
            Narration audio is held in a private storage bucket and is never
            publicly addressable. Playback uses short-lived signed links.
          </li>
          <li>Access to production systems is limited and credential-based.</li>
        </ul>
        <p>
          No system is perfectly secure. If we ever become aware of a breach
          affecting your information, we will notify affected users.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Your rights and choices</h2>
        <p>
          Depending on where you live, you may have the right to access,
          correct, delete, or receive a copy of your personal information, and to
          object to or restrict certain processing. To exercise any of these
          rights, email us at{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>. We
          will respond within the timeframe required by applicable law.
        </p>
      </section>

      <section className={styles.section}>
        <h2>8. Deleting your account and data</h2>
        <p>
          To delete your account and everything in it — your trainings, lecture
          text, and narration audio — email us at{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> from
          the address associated with your account. We will confirm and complete
          the deletion. Deletion is permanent and cannot be undone.
        </p>
        <div className={styles.note}>
          Self-serve deletion from inside the app is not available yet. Until it
          is, the email route above is the way to remove your data, and we will
          update this policy when that changes.
        </div>
      </section>

      <section className={styles.section}>
        <h2>9. Children</h2>
        <p>
          {LEGAL.product} is not intended for anyone under {LEGAL.minimumAge}, and
          we do not knowingly collect information from them. If you believe a
          child has created an account, contact us and we will remove it.
        </p>
      </section>

      <section className={styles.section}>
        <h2>10. International transfers</h2>
        <p>
          Our providers may store and process information in countries other than
          yours, including the United States. Where required, we rely on
          appropriate safeguards for those transfers.
        </p>
      </section>

      <section className={styles.section}>
        <h2>11. Changes to this policy</h2>
        <p>
          If we change this policy in a way that materially affects you, we will
          update the effective date above and, where appropriate, notify you.
        </p>
      </section>

      <section className={styles.section}>
        <h2>12. Contact</h2>
        <p>
          Questions about this policy or your information? Email{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
        </p>
      </section>

      <p className={styles.footerNote}>
        See also our <Link href="/terms">Terms of Service</Link>.
      </p>
    </main>
  );
}
