import { chunkTextForSpeech } from "@/lib/tts/chunkText";

export type GeneratedAudio = {
  data: Buffer;
  contentType: string;
};

export class TtsConfigurationError extends Error {
  constructor(message = "Audio generation is not configured. Set TTS_API_KEY (or TTS_BASE_URL for a local server) in your environment.") {
    super(message);
    this.name = "TtsConfigurationError";
  }
}

export class TtsGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TtsGenerationError";
  }
}

const TTS_TIMEOUT_MS = 60_000;

const env = (name: string): string => (process.env[name] || "").trim();

const trimBase = (base: string): string => base.replace(/\/+$/, "");

/**
 * Any OpenAI-compatible speech endpoint works here: OpenAI itself, or a
 * self-hosted server such as Kokoro-FastAPI, openedai-speech, LocalAI or
 * Speaches. Chunks are joined into a single file, and joining is only valid
 * for MP3, so MP3 is the only output format this code will assemble.
 */
function resolveTtsEndpoint(): string {
  const base = env("TTS_BASE_URL") || "https://api.openai.com/v1";
  return `${trimBase(base)}/audio/speech`;
}

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

async function synthesizeChunk(
  text: string,
  apiKey: string,
  format: string,
): Promise<{ data: Buffer; contentType: string }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

  try {
    const response = await fetch(resolveTtsEndpoint(), {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: env("TTS_MODEL") || "tts-1",
        voice: env("TTS_VOICE") || "alloy",
        response_format: format,
        input: text,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      if (response.status === 401 || response.status === 403) {
        throw new TtsGenerationError(
          `The speech provider rejected the API key (${response.status}). Check TTS_API_KEY.`,
        );
      }
      throw new TtsGenerationError(
        `The speech provider returned ${response.status}. ${detail.slice(0, 200)}`.trim(),
      );
    }

    return {
      data: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers?.get?.("content-type") || `audio/${format}`,
    };
  } catch (error) {
    if (error instanceof TtsGenerationError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new TtsGenerationError("The speech provider timed out.");
    }
    throw new TtsGenerationError(
      error instanceof Error ? error.message : "The speech provider request failed.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateAudio(text: string): Promise<GeneratedAudio> {
  const apiKey = env("TTS_API_KEY");
  const baseUrl = env("TTS_BASE_URL");

  // A remote provider needs a key; a local server may not.
  if (!apiKey && !baseUrl) {
    throw new TtsConfigurationError();
  }

  const format = (env("TTS_FORMAT") || "mp3").toLowerCase();
  if (format !== "mp3") {
    throw new TtsConfigurationError(
      `TTS_FORMAT is "${format}". Lecture audio is assembled from multiple requests, and only MP3 segments join cleanly. Set TTS_FORMAT=mp3 or leave it unset.`,
    );
  }

  const chunks = chunkTextForSpeech(text);
  if (chunks.length === 0) {
    throw new TtsGenerationError("There is no lecture text to narrate.");
  }

  const parts: Buffer[] = [];
  let contentType = "audio/mpeg";

  for (let index = 0; index < chunks.length; index += 1) {
    const segment = await synthesizeChunk(chunks[index], apiKey, format);
    if (index === 0) {
      contentType = segment.contentType;
      // Guard against a provider silently returning WAV or OGG, which cannot
      // be byte-joined with MP3 without producing corrupt audio.
      if (chunks.length > 1 && !/mpeg|mp3/i.test(contentType)) {
        throw new TtsGenerationError(
          `The speech provider returned "${contentType}" instead of MP3, so the segments cannot be joined. Use an MP3-capable provider, or leave TTS_BASE_URL unset.`,
        );
      }
    }
    parts.push(stripId3v2(segment.data));
  }

  return { data: Buffer.concat(parts), contentType };
}
