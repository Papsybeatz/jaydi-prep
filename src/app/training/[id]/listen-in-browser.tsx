"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

/**
 * Zero-cost listening path. When no stored narration exists (for example the
 * TTS key is not configured yet), the lecture can still be read aloud by the
 * device's own voice. Nothing is uploaded, stored, or downloaded.
 *
 * Text is spoken in short sentences rather than one utterance because several
 * browsers cut a long utterance off after roughly fifteen seconds.
 */

const MAX_CHUNK_CHARS = 180;

function splitForSpeech(text: string): string[] {
  const pieces = text.match(/[^.!?\n]+[.!?]*[\n]*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    if (current) {
      chunks.push(current);
      current = "";
    }
  };

  for (const raw of pieces) {
    const sentence = raw.replace(/\s+/g, " ").trim();
    if (!sentence) {
      continue;
    }
    if (sentence.length > MAX_CHUNK_CHARS) {
      flush();
      for (let i = 0; i < sentence.length; i += MAX_CHUNK_CHARS) {
        const slice = sentence.slice(i, i + MAX_CHUNK_CHARS).trim();
        if (slice) {
          chunks.push(slice);
        }
      }
      continue;
    }
    if (!current) {
      current = sentence;
    } else if (current.length + 1 + sentence.length <= MAX_CHUNK_CHARS) {
      current = `${current} ${sentence}`;
    } else {
      flush();
      current = sentence;
    }
  }
  flush();

  return chunks;
}

function subscribeToSpeechSupport() {
  return () => {};
}

function getSpeechSupport() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance === "function"
  );
}

function getServerSpeechSupport() {
  return false;
}

export default function ListenInBrowser({ text }: { text: string }) {
  const chunks = useMemo(() => splitForSpeech(text), [text]);
  const supported = useSyncExternalStore(
    subscribeToSpeechSupport,
    getSpeechSupport,
    getServerSpeechSupport,
  );
  const [playing, setPlaying] = useState(false);
  const cancelledRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function stop() {
    cancelledRef.current = true;
    if (supported) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
  }

  function play() {
    if (!supported || chunks.length === 0) {
      return;
    }
    window.speechSynthesis.cancel();
    cancelledRef.current = false;
    setPlaying(true);

    let index = 0;
    const speakNext = () => {
      if (cancelledRef.current || index >= chunks.length) {
        setPlaying(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.rate = 1;
      utterance.onend = () => {
        index += 1;
        speakNext();
      };
      utterance.onerror = () => {
        setPlaying(false);
      };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  }

  if (!supported) {
    return null;
  }

  return (
    <section
      aria-label="Read the lecture aloud"
      style={{
        border: "1px solid #e0e5de",
        borderRadius: 10,
        marginBottom: 32,
        padding: "14px 16px",
      }}
    >
      <button
        type="button"
        onClick={playing ? stop : play}
        style={{
          background: playing ? "#eef1ec" : "#1f2a1f",
          border: "none",
          borderRadius: 8,
          color: playing ? "#1f2a1f" : "#fff",
          cursor: "pointer",
          fontSize: 15,
          fontWeight: 600,
          padding: "10px 18px",
        }}
      >
        {playing ? "Stop" : "Listen to this lecture"}
      </button>
      <p style={{ color: "#586158", fontSize: 14, margin: "10px 0 0" }}>
        Plays through your device&apos;s voice — nothing is uploaded or
        downloaded. Narration can also be generated as an audio file when the
        audio service is configured.
      </p>
    </section>
  );
}
