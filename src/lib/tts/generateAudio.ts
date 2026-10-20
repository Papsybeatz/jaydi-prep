import { chunkTextForSpeech } from "@/lib/tts/chunkText";

export type GeneratedAudio = {
  data: Buffer;
  contentType: string;
};

export class TtsConfigurationError extends Error {
  constructor() {
    super(
      "Audio generation is not configured. Set TTS_API_KEY in your environment.",
    );
    this.name = "TtsConfigurationError";
  }
}

export class TtsGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TtsGenerationError";
  }
}

const TTS_ENDPOINT = "https://api.openai.com/v1/audio/speech";
const TTS_TIMEOUT_MS = 60_000;

/**
 * Each chunk comes back as a standalone MP3 that may carry its own ID3v2 tag.
 * Concatenating the raw bodies would embed a tag mid-file, so strip the tag
 * from every chunk before joining them.
 */
function stripId3v2(buffer: Buffer): Buffer {
  if (
    buffer.length < 10 ||
    buffer[0] !== 0x49 || // "I"
    buffer[1] !== 0x44 || // "D"
    buffer[2] !== 0x33 // "3"
  ) {
    return buffer;
  }

  const size =
    ((buffer[6] & 0x7f) << 21) |
    ((buffer[7] & 0x7f) << 14) |
    ((buffer[8] & 0x7f) << 7) |
    (buffer[9] & 0x7f);
  const end = 10 + size;

  return end < buffer.length ? buffer.subarray(end) : buffer;
}

async function synthesizeChunk(text: string, apiKey: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

  try {
    const response = await fetch(TTS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.TTS_MODEL || "tts-1",
        voice: process.env.TTS_VOICE || "alloy",
        response_format: "mp3",
        input: text,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new TtsGenerationError(
        `The speech service returned ${response.status}. ${detail.slice(0, 200)}`.trim(),
      );
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    if (error instanceof TtsGenerationError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new TtsGenerationError("The speech service timed out.");
    }
    throw new TtsGenerationError(
      error instanceof Error ? error.message : "The speech service request failed.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateAudio(text: string): Promise<GeneratedAudio> {
  const apiKey = process.env.TTS_API_KEY;
  if (!apiKey) {
    throw new TtsConfigurationError();
  }

  const chunks = chunkTextForSpeech(text);
  if (chunks.length === 0) {
    throw new TtsGenerationError("There is no lecture text to narrate.");
  }

  const parts: Buffer[] = [];
  for (const chunk of chunks) {
    const audio = await synthesizeChunk(chunk, apiKey);
    parts.push(stripId3v2(audio));
  }

  return { data: Buffer.concat(parts), contentType: "audio/mpeg" };
}
