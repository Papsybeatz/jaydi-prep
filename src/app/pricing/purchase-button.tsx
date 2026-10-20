"use client";

import { useState } from "react";

export default function PurchaseButton({
  label,
  passId,
  variant = "primary",
}: {
  label: string;
  passId: string;
  variant?: "primary" | "quiet";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passId }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout.");
      }
      window.location.href = data.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Could not start checkout.",
      );
      setLoading(false);
    }
  }

  const primary = variant === "primary";

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        style={{
          background: primary ? "#1f2a1f" : "transparent",
          border: primary ? "none" : "1px solid #c9d1c6",
          borderRadius: 8,
          color: primary ? "#fff" : "#1f2a1f",
          cursor: loading ? "default" : "pointer",
          fontSize: 15,
          fontWeight: 600,
          opacity: loading ? 0.7 : 1,
          padding: "11px 18px",
          width: primary ? "100%" : undefined,
        }}
      >
        {loading ? "Opening checkout…" : label}
      </button>
      {error && (
        <p role="alert" style={{ color: "#a3311f", fontSize: 14, margin: "10px 0 0" }}>
          {error}
        </p>
      )}
    </div>
  );
}
