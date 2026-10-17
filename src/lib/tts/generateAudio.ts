import { writeFile } from "fs/promises";
import path from "path";

export async function generateAudio(text: string): Promise<string> {
  const apiKey = process.env.TTS_API_KEY;
  if (!apiKey) {
    return "";
  }
  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "tts-1",
        voice: "alloy",
        input: text,
      }),
    });
    if (!response.ok) throw new Error(`TTS API error: ${response.statusText}`);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:audio/mpeg;base64,${base64}`;
  } catch (error) {
    console.error(error);
    return "";
  }
}
