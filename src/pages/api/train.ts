import type { NextApiRequest, NextApiResponse } from "next";
import { saveTraining } from "@/lib/db/trainings";
import { SupabaseConfigurationError } from "@/lib/db/supabase";

type TrainResponse =
  | { id: string; lectureText: string; audioUrl: string }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TrainResponse>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { resume, jobDescription } = req.body ?? {};
    if (typeof resume !== "string" || !resume.trim()) {
      return res.status(400).json({ error: "Resume is required" });
    }
    if (typeof jobDescription !== "string" || !jobDescription.trim()) {
      return res.status(400).json({ error: "Job description is required" });
    }
    const maxChars = 20000;
    if (resume.length > maxChars || jobDescription.length > maxChars) {
      return res.status(400).json({ error: `Resume or job description must be less than ${maxChars} characters` });
    }
    const { generateLecture } = await import("@/lib/ai/generateLecture");
    const { generateAudio } = await import("@/lib/tts/generateAudio");
    const lectureText = await generateLecture(resume, jobDescription);
    const audioUrl = await generateAudio(lectureText);
    const training = await saveTraining({
      resume: resume.trim(),
      jobDescription: jobDescription.trim(),
      lectureText,
      audioUrl,
    });
    return res.status(200).json({ id: training.id, lectureText, audioUrl });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return res.status(503).json({ error: error.message });
    }
    console.error(error);
    return res.status(500).json({ error: "Failed to generate training" });
  }
}
