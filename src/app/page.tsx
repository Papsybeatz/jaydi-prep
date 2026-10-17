"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

type TrainResponse = {
  id?: string;
  error?: string;
};

export default function Home() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: form.get("resume"),
          jobDescription: form.get("jobDescription"),
        }),
      });
      const result: TrainResponse = await response.json();

      if (!response.ok || !result.id) {
        throw new Error(result.error || "Failed to generate training.");
      }

      router.push(`/training/${result.id}`);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to generate training.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>JAYDI · INTERVIEW PREP</p>
          <h1>Show up ready.</h1>
          <p className={styles.intro}>
            Turn your experience and the role you want into a focused interview
            training.
          </p>
        </div>
        <Link className={styles.historyLink} href="/history">
          Training history
        </Link>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>Resume</span>
          <textarea
            name="resume"
            rows={8}
            maxLength={20000}
            placeholder="Paste your resume"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Job description</span>
          <textarea
            name="jobDescription"
            rows={8}
            maxLength={20000}
            placeholder="Paste the job description"
            required
          />
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button className={styles.submit} disabled={isSubmitting} type="submit">
          {isSubmitting ? "Building your training…" : "Generate training"}
        </button>
      </form>
    </main>
  );
}
