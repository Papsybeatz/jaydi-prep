import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/legal";
import styles from "@/app/legal.module.css";

export const metadata: Metadata = {
  title: `Terms of Service — ${LEGAL.product}`,
  description: `The terms that govern your use of ${LEGAL.product}, including acceptable use, your content, and the limits of what the service promises.`,
};

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} href="/">
        ← Back to {LEGAL.product}
      </Link>

      <h1 className={styles.title}>Terms of Service</h1>
      <p className={styles.updated}>Effective {LEGAL.effectiveDate}</p>
      <p className={styles.intro}>
        These terms govern your use of {LEGAL.product}, operated by{" "}
        {LEGAL.company}. By creating an account or using the service, you agree
        to them. If you do not agree, please do not use {LEGAL.product}.
      </p>

      <section className={styles.section}>
        <h2>1. What {LEGAL.product} is</h2>
        <p>
          {LEGAL.product} is an interview-preparation tool. You provide a resume
          and a job description, and it generates a written lecture about that
          role, optionally with narrated audio you can listen to.
        </p>
        <div className={styles.note}>
          <b>{LEGAL.product} provides preparation guidance, not a promise of an
          interview or a job.</b> It is not career, legal, financial, or
          psychological advice, and it does not guarantee any outcome.
        </div>
      </section>

      <section className={styles.section}>
        <h2>2. Eligibility and your account</h2>
        <ul>
          <li>You must be at least {LEGAL.minimumAge} years old to use the service.</li>
          <li>
            You are responsible for the accuracy of your account information and
            for keeping your password confidential.
          </li>
          <li>
            You are responsible for activity that happens under your account.
            Tell us promptly if you believe it has been compromised.
          </li>
          <li>One account per person. Do not share your account credentials.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>3. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>
            Submit content that is not yours to submit, including another
            person&apos;s resume or personal information, without their
            permission.
          </li>
          <li>
            Use the service unlawfully, to harass anyone, or to misrepresent
            your qualifications to an employer.
          </li>
          <li>
            Attempt to bypass authentication, access another account&apos;s data,
            or probe the service for vulnerabilities without our written
            permission.
          </li>
          <li>
            Scrape, crawl, or automate access, or resell or redistribute the
            service or its output as your own product.
          </li>
          <li>
            Circumvent usage limits or take actions that place an unreasonable
            load on our systems or our providers.
          </li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate these rules.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Your content</h2>
        <p>
          You keep all rights to the resume, job description, and other content
          you submit. You grant us a limited licence to store and process that
          content solely to operate the service for you — for example, to send it
          to our AI provider to generate your lecture, and to save the result to
          your account.
        </p>
        <p>
          That licence ends when you delete the content or your account, except
          where we must retain something to comply with law.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. AI-generated output</h2>
        <p>
          Lectures and audio are generated automatically by AI models. They can
          be inaccurate, incomplete, or generic, and they may not reflect your
          actual experience. You are responsible for what you choose to say in
          an interview. Review anything you intend to rely on, and do not treat
          generated content as a statement of fact about you or the employer.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Fees</h2>
        <p>
          {LEGAL.product} is currently free to use. If we introduce paid plans,
          we will present the price and terms before you are charged, and these
          terms will be updated accordingly.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Our intellectual property</h2>
        <p>
          The {LEGAL.product} name, interface, and underlying software belong to{" "}
          {LEGAL.company}. These terms do not grant you any right to them beyond
          using the service as intended.
        </p>
      </section>

      <section className={styles.section}>
        <h2>8. Third-party services</h2>
        <p>
          We rely on third parties to run the service, including the providers
          listed in our <Link href="/privacy">Privacy Policy</Link>. Their
          availability and performance are outside our control, and your use of
          the service is also subject to any terms they impose.
        </p>
      </section>

      <section className={styles.section}>
        <h2>9. Disclaimers</h2>
        <p>
          The service is provided &quot;as is&quot; and &quot;as available&quot;
          without warranties of any kind, express or implied, including
          merchantability, fitness for a particular purpose, and
          non-infringement. We do not warrant that the service will be
          uninterrupted, error-free, or that generated content will be accurate
          or suitable for your situation.
        </p>
      </section>

      <section className={styles.section}>
        <h2>10. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, {LEGAL.company} will not be
          liable for indirect, incidental, special, consequential, or punitive
          damages, or for lost opportunities, lost income, or lost employment
          prospects, arising out of your use of the service. Our total liability
          for any claim relating to the service will not exceed the greater of
          the amount you paid us in the twelve months before the claim or
          US$50.
        </p>
      </section>

      <section className={styles.section}>
        <h2>11. Termination</h2>
        <p>
          You may stop using {LEGAL.product} at any time and ask us to delete
          your account. We may suspend or end your access if you breach these
          terms or if we discontinue the service. Where practical, we will give
          you notice so you can retrieve your content.
        </p>
      </section>

      <section className={styles.section}>
        <h2>12. Governing law</h2>
        <p>
          These terms are governed by the laws of {LEGAL.governingLaw}, without
          regard to its conflict-of-law rules. Any dispute will be handled in the
          courts located there, unless the law where you live gives you the right
          to bring it elsewhere.
        </p>
      </section>

      <section className={styles.section}>
        <h2>13. Changes to these terms</h2>
        <p>
          We may update these terms as the product evolves. If a change
          materially affects you, we will update the effective date above and,
          where appropriate, notify you. Continuing to use {LEGAL.product} after
          a change means you accept the updated terms.
        </p>
      </section>

      <section className={styles.section}>
        <h2>14. Contact</h2>
        <p>
          Questions about these terms? Email{" "}
          <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
        </p>
      </section>

      <p className={styles.footerNote}>
        See also our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </main>
  );
}
