"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ListenInBrowser from "@/app/training/[id]/listen-in-browser";
import PurchaseButton from "@/app/pricing/purchase-button";
import {
  DEFAULT_TIER,
  FREE_AUDIO_PREVIEW_CHARS,
  formatPrice,
  narrationLabel,
} from "@/lib/billing/config";

function previewText(text: string): string {
  if (text.length <= FREE_AUDIO_PREVIEW_CHARS) {
    return text;
  }
  const slice = text.slice(0, FREE_AUDIO_PREVIEW_CHARS);
  const boundary = slice.lastIndexOf(" ");
  return `${(boundary > 0 ? slice.slice(0, boundary) : slice).trim()}…`;
}

const card = {
  border: "1px solid #e0e5de",
  borderRadius: 12,
  marginBottom: 32,
  padding: "20px 22px",
} as const;

const eyebrow = {
  color: "#6b5a33",
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "0.06em",
  margin: "0 0 6px",
  textTransform: "uppercase",
} as const;

export default function AudioLocked({
  trainingId,
  lectureText,
  credits,
}: {
  trainingId: string;
  lectureText: string;
  credits: number;
}) {
  const router = useRouter();
  const [narrating, setNarrating] = useState(false);
  const [error, setError] = useState("");

  async function addNarration() {
    setNarrating(true);
    setError("");
    try {
      const response = await fetch(`/api/train/${trainingId}/narration`, {
        method: "POST",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Could not add narration.");
      }
      router.refresh();
    } catch (narrationError) {
      setError(
        narrationError instanceof Error
          ? narrationError.message
          : "Could not add narration.",
      );
      setNarrating(false);
    }
  }

  const hasCredits = credits > 0;

  return (
    <section aria-label="Audio narration" style={card}>
      <p style={eyebrow}>Audio narration</p>

      {hasCredits ? (
        <>
          <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>
            Add audio to this lecture
          </h2>
          <p style={{ color: "#4a544a", margin: "0 0 16px" }}>
            You have {narrationLabel(credits)} left. Using one narrates this
            lecture in full — downloadable, and playable in the car.
          </p>

          <ListenInBrowser
            text={previewText(lectureText)}
            label="Play a 30-second preview"
            note="A short preview in your device's voice, before you spend a credit."
          />

          <div style={{ marginTop: 18 }}>
            <button
              type="button"
              onClick={addNarration}
              disabled={narrating}
              style={{
                background: "#1f2a1f",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                cursor: narrating ? "default" : "pointer",
                fontSize: 15,
                fontWeight: 600,
                opacity: narrating ? 0.7 : 1,
                padding: "11px 18px",
              }}
            >
              {narrating
                ? "Narrating… this can take a minute"
                : `Narrate this lecture — 1 credit (${credits} left)`}
            </button>
          </div>

          {error && (
            <p role="alert" style={{ color: "#a3311f", fontSize: 14, margin: "10px 0 0" }}>
              {error}
            </p>
          )}
          <p style={{ color: "#586158", fontSize: 14, margin: "12px 0 0" }}>
            If narration fails, your credit is returned automatically.
          </p>
        </>
      ) : (
        <>
          <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>
            Listen on the way there
          </h2>
          <p style={{ color: "#4a544a", margin: "0 0 16px" }}>
            Your written lecture is free and always will be. A pass adds the
            narrated version — read aloud and downloadable, so you can play it
            in the car instead of at your desk.
          </p>

          <ListenInBrowser
            text={previewText(lectureText)}
            label="Play a 30-second preview"
            note="A short preview in your device's voice."
          />

          <div style={{ marginTop: 18 }}>
            <PurchaseButton
              passId={DEFAULT_TIER.id}
              label={`Unlock ${narrationLabel(DEFAULT_TIER.credits)} — ${formatPrice(DEFAULT_TIER.priceCents)}`}
            />
          </div>

          <p style={{ color: "#586158", fontSize: 14, margin: "12px 0 0" }}>
            One-time purchase. Credits never expire.{" "}
            <Link href="/pricing" style={{ textDecoration: "underline" }}>
              Other options
            </Link>
          </p>
        </>
      )}
    </section>
  );
}
