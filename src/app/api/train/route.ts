import { saveTraining } from "@/lib/db/trainings";
import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { getAuthenticatedUser } from "@/lib/supabase/server";

type TrainResponse =
  | { id: string; lectureText: string; audioUrl: string }
  | { error: string };

function jsonResponse(body: TrainResponse, status = 200): Response {
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return jsonResponse({ error: "Sign in to create and save a training." }, 401);
    }

    let body: { resume?: unknown; jobDescription?: unknown };
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Request body must be valid JSON." }, 400);
    }

    const { resume, jobDescription } = body;
    if (typeof resume !== "string" || !resume.trim()) {
      return jsonResponse({ error: "Resume is required." }, 400);
    }
    if (typeof jobDescription !== "string" || !jobDescription.trim()) {
      return jsonResponse({ error: "Job description is required." }, 400);
    }
    const maxChars = 20_000;
    if (resume.length > maxChars || jobDescription.length > maxChars) {
      return jsonResponse(
        { error: `Resume or job description must be less than ${maxChars} characters.` },
        400,
      );
    }

    const { generateLecture } = await import("@/lib/ai/generateLecture");
    const { generateAudio } = await import("@/lib/tts/generateAudio");
    const lectureText = await generateLecture(resume, jobDescription);
    const audioUrl = await generateAudio(lectureText);
    const training = await saveTraining(
      {
        resume: resume.trim(),
        jobDescription: jobDescription.trim(),
        lectureText,
        audioUrl,
      },
      user.id,
    );

    return jsonResponse({ id: training.id, lectureText, audioUrl });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return jsonResponse({ error: error.message }, 503);
    }
    console.error(error);
    return jsonResponse({ error: "Failed to generate training." }, 500);
  }
}
