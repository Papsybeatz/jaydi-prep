"use client";

import Link from "next/link";
import ListenInBrowser from "@/app/training/[id]/listen-in-browser";
import PurchaseButton from "@/app/pricing/purchase-button";
import {
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

export default function AudioLocked({
  lectureText,
  hasCredits,
}: {
  lectureText: string;
  hasCredits: boolean;
}) {
  const card = {
    border: "1px solid #e0e5de",
    borderRadius: 12,
    marginBottom: 32,
    padding: "20px 22px",
  } as const;

  if (hasCredits) {
    return (
      <section aria-label="Audio unavailable" style={card}>
        <p
          style={{
            color: "#6b5a33",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.06em",
            margin: "0 0 6px",
            textTransform: "uppercase",
          }}
        >
          Audio narration
        </p>
        <p style={{ margin: 0 }}>
          Narration for this training didn&apos;t complete, so your credit was
          returned — nothing was used. The written lecture is below.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Unlock audio narration" style={card}>
      <p
        style={{
          color: "#6b5a33",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "0.06em",
          margin: "0 0 6px",
          textTransform: "uppercase",
        }}
      >
        Audio narration
      </p>
      <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>
        Listen on the way there
      </h2>
      <p style={{ color: "#4a544a", margin: "0 0 16px" }}>
        Your written lecture is free and always will be. A pass adds the
        narrated version — read aloud and downloadable, so you can play it in
        the car instead of at your desk.
      </p>

      <ListenInBrowser
        text={previewText(lectureText)}
        label="Play a 30-second preview"
        note="A short preview in your device's voice."
      />

      <div style={{ marginTop: 18 }}>
        <PurchaseButton
          label={`Unlock ${narrationLabel()} — ${formatPrice()}`}
        />
      </div>

      <p style={{ color: "#586158", fontSize: 14, margin: "12px 0 0" }}>
        One-time purchase. Credits never expire.{" "}
        <Link href="/pricing" style={{ textDecoration: "underline" }}>
          What&apos;s included
        </Link>
      </p>
    </section>
  );
}
