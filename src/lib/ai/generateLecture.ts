export class LectureConfigurationError extends Error {
  constructor(message = "Lecture generation is not configured. Set GROQ_API_KEY or OPENAI_API_KEY in your environment.") {
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
  name: "groq" | "openai";
  apiKey: string;
  endpoint: string;
  defaultModel: string;
};

/**
 * Both providers speak the OpenAI chat-completions dialect, so one code path
 * serves them. Selection order:
 *   1. LLM_PROVIDER, when explicitly set to "groq" or "openai"
 *   2. OPENAI_API_KEY, because it also unlocks speech generation
 *   3. GROQ_API_KEY
 */
function resolveChatProvider(): ChatProvider {
  const forced = (process.env.LLM_PROVIDER || "").trim().toLowerCase();
  const openAiKey = (process.env.OPENAI_API_KEY || "").trim();
  const groqKey = (process.env.GROQ_API_KEY || "").trim();

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
  const model =
    (process.env.LLM_MODEL || "").trim() || provider.defaultModel;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

  try {
    const response = await fetch(provider.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
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
      // Groq returns 429 when the free-tier tokens-per-minute budget is spent.
      if (response.status === 429) {
        throw new LectureGenerationError(
          "The lecture service is busy or out of quota right now. Please try again in a minute.",
        );
      }
      throw new LectureGenerationError(
        `The lecture service (${provider.name}) returned ${response.status}. ${detail.slice(0, 200)}`.trim(),
      );
    }

    const data = await response.json();
    const lecture = data?.choices?.[0]?.message?.content?.trim();

    if (!lecture) {
      throw new LectureGenerationError(
        "The lecture service returned an empty response. Please try again.",
      );
    }

    return lecture;
  } catch (error) {
    if (error instanceof LectureGenerationError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new LectureGenerationError("The lecture service timed out. Please try again.");
    }
    throw new LectureGenerationError(
      error instanceof Error ? error.message : "The lecture service request failed.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
