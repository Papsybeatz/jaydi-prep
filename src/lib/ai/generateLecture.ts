export class LectureConfigurationError extends Error {
  constructor(message = "Lecture generation is not configured. Set LLM_BASE_URL + LLM_MODEL (any OpenAI-compatible provider), or GROQ_API_KEY, or OPENAI_API_KEY.") {
    super(message);
    this.name = "LectureConfigurationError";
  }
}

export class LectureGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LectureGenerationError";
  }
}

const CHAT_TIMEOUT_MS = 90_000;
const MAX_LECTURE_TOKENS = 4000;

const SYSTEM_PROMPT =
  "You are a role embodiment coach. Generate a structured lecture with sections: Understanding the role, Resume vs role, Skill gaps, How to think like this role, How to speak like this role, Interview strategy, Embodiment exercises. Return plain text.";

type ChatProvider = {
  name: string;
  apiKey: string;
  endpoint: string;
  defaultModel: string;
};

const env = (name: string): string => (process.env[name] || "").trim();

const trimBase = (base: string): string => base.replace(/\/+$/, "");

/**
 * Jaydi talks to any provider that speaks the OpenAI chat-completions dialect,
 * so the same code runs against OpenRouter, Together, Fireworks, DeepInfra,
 * Cerebras, Hugging Face, a local Ollama/vLLM server, or OpenAI itself.
 *
 * Selection order:
 *   1. LLM_BASE_URL        — explicit endpoint, works with any compatible host
 *   2. LLM_PROVIDER        — "groq" or "openai" preset
 *   3. OPENAI_API_KEY
 *   4. GROQ_API_KEY
 *
 * Use a dedicated key for this app. Never share one key across products: a
 * shared key shares its quota, its bill, and its blast radius.
 */
function resolveChatProvider(): ChatProvider {
  const baseUrl = env("LLM_BASE_URL");
  const model = env("LLM_MODEL");
  const genericKey = env("LLM_API_KEY");

  if (baseUrl) {
    if (!model) {
      throw new LectureConfigurationError(
        "LLM_BASE_URL is set but LLM_MODEL is missing. Name the model your provider should run, e.g. LLM_MODEL=meta-llama/llama-3.3-70b-instruct.",
      );
    }
    return {
      name: "custom endpoint",
      apiKey: genericKey, // optional: local servers such as Ollama need none
      endpoint: `${trimBase(baseUrl)}/chat/completions`,
      defaultModel: model,
    };
  }

  const forced = env("LLM_PROVIDER").toLowerCase();
  const openAiKey = env("OPENAI_API_KEY");
  const groqKey = env("GROQ_API_KEY");

  const openai: ChatProvider = {
    name: "openai",
    apiKey: openAiKey,
    endpoint: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o-mini",
  };
  const groq: ChatProvider = {
    name: "groq",
    apiKey: groqKey,
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "openai/gpt-oss-120b",
  };

  if (forced === "groq") {
    if (!groqKey) {
      throw new LectureConfigurationError(
        "LLM_PROVIDER is set to groq but GROQ_API_KEY is missing.",
      );
    }
    return groq;
  }
  if (forced === "openai") {
    if (!openAiKey) {
      throw new LectureConfigurationError(
        "LLM_PROVIDER is set to openai but OPENAI_API_KEY is missing.",
      );
    }
    return openai;
  }
  if (openAiKey) {
    return openai;
  }
  if (groqKey) {
    return groq;
  }

  throw new LectureConfigurationError();
}

export async function generateLecture(resume: string, jd: string): Promise<string> {
  const provider = resolveChatProvider();
  const model = env("LLM_MODEL") || provider.defaultModel;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (provider.apiKey) {
    headers.Authorization = `Bearer ${provider.apiKey}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

  try {
    const response = await fetch(provider.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Resume:\n${resume}\n\nJob Description:\n${jd}` },
        ],
        temperature: 0.7,
        max_tokens: MAX_LECTURE_TOKENS,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      if (response.status === 429) {
        throw new LectureGenerationError(
          "The lecture provider is busy or out of quota right now. Please try again in a minute.",
        );
      }
      if (response.status === 401 || response.status === 403) {
        throw new LectureGenerationError(
          `The lecture provider rejected the API key (${response.status}). Check LLM_API_KEY.`,
        );
      }
      if (response.status === 404) {
        throw new LectureGenerationError(
          `The lecture provider could not find the model "${model}" (404). Check LLM_MODEL.`,
        );
      }
      throw new LectureGenerationError(
        `The lecture provider (${provider.name}) returned ${response.status}. ${detail.slice(0, 200)}`.trim(),
      );
    }

    const data = await response.json();
    const lecture = data?.choices?.[0]?.message?.content?.trim();

    if (!lecture) {
      throw new LectureGenerationError(
        "The lecture provider returned an empty response. Please try again.",
      );
    }

    return lecture;
  } catch (error) {
    if (error instanceof LectureGenerationError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new LectureGenerationError("The lecture provider timed out. Please try again.");
    }
    throw new LectureGenerationError(
      error instanceof Error ? error.message : "The lecture provider request failed.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
