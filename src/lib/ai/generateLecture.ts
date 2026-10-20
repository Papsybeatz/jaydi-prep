export class LectureConfigurationError extends Error {
  constructor() {
    super(
      "Lecture generation is not configured. Set OPENAI_API_KEY in your environment.",
    );
    this.name = "LectureConfigurationError";
  }
}

export class LectureGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LectureGenerationError";
  }
}

const OPENAI_CHAT_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const OPENAI_CHAT_TIMEOUT_MS = 90_000;
const MAX_LECTURE_TOKENS = 4000;

const SYSTEM_PROMPT =
  "You are a role embodiment coach. Generate a structured lecture with sections: Understanding the role, Resume vs role, Skill gaps, How to think like this role, How to speak like this role, Interview strategy, Embodiment exercises. Return plain text.";

export async function generateLecture(resume: string, jd: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new LectureConfigurationError();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_CHAT_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
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
      throw new LectureGenerationError(
        `The lecture service returned ${response.status}. ${detail.slice(0, 200)}`.trim(),
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
