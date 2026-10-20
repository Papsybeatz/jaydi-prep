/**
 * OpenAI's speech endpoint rejects input longer than 4096 characters, so a
 * full lecture must be narrated in pieces. This splits text on the largest
 * natural boundary that fits, so each chunk ends at a sentence where possible.
 */

export const MAX_TTS_INPUT_CHARS = 4000;

export function chunkTextForSpeech(
  text: string,
  maxChars: number = MAX_TTS_INPUT_CHARS,
): string[] {
  if (maxChars < 1) {
    throw new Error("maxChars must be a positive number.");
  }

  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) {
    return [];
  }
  if (normalized.length <= maxChars) {
    return [normalized];
  }

  const chunks: string[] = [];
  let current = "";

  const append = (piece: string) => {
    const trimmed = piece.trim();
    if (!trimmed) {
      return;
    }
    if (!current) {
      current = trimmed;
      return;
    }
    if (current.length + 2 + trimmed.length <= maxChars) {
      current = `${current}\n\n${trimmed}`;
      return;
    }
    chunks.push(current);
    current = trimmed;
  };

  for (const paragraph of normalized.split(/\n{2,}/)) {
    if (paragraph.length <= maxChars) {
      append(paragraph);
      continue;
    }

    const sentences =
      paragraph.match(/[^.!?]+[.!?]+[\s]*|[^.!?]+$/g) ?? [paragraph];

    for (const sentence of sentences) {
      if (sentence.length <= maxChars) {
        append(sentence);
        continue;
      }

      // A single sentence longer than the limit (e.g. a bulleted list with no
      // punctuation): wrap on the last word boundary that fits.
      let remainder = sentence.trim();
      while (remainder.length > maxChars) {
        let cut = remainder.lastIndexOf(" ", maxChars);
        if (cut <= 0) {
          cut = maxChars;
        }
        append(remainder.slice(0, cut));
        remainder = remainder.slice(cut).trim();
      }
      append(remainder);
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}
