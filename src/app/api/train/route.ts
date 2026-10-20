import { saveTraining } from "@/lib/db/trainings";
import {
  LectureConfigurationError,
  LectureGenerationError,
} from "@/lib/ai/generateLecture";
import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { getAuthenticatedUser } from "@/lib/supabase/server";

// Generating the lecture alone is fast; narration happens later, on its own
// request, so this route does not need a long function budget.
export const maxDuration = 30;

type TrainResponse = { id: string; lectureText: string } | { error: string };

function jsonResponse(body: TrainResponse, status = 200): Response {
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  let user;
  try {
    user = await getAuthenticatedUser();
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return jsonResponse({ error: error.message }, 503);
    }
    console.error("Could not validate session for training creation.", error);
    return jsonResponse({ error: "Could not verify your session." }, 500);
  }
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
  let lectureText: string;
  try {
    lectureText = await generateLecture(resume.trim(), jobDescription.trim());
  } catch (error) {
    if (error instanceof LectureConfigurationError) {
      return jsonResponse({ error: error.message }, 503);
    }
    if (error instanceof LectureGenerationError) {
      console.error("Lecture generation failed.", error);
      return jsonResponse({ error: error.message }, 502);
    }
    console.error("Unexpected lecture generation failure.", error);
    return jsonResponse({ error: "Failed to generate training." }, 500);
  }

  // Creating a training never spends a credit. Narration is a separate,
  // deliberate action on /training/[id], so "N narrations" means N of your
  // choice rather than "the next N you happen to create".
  try {
    const training = await saveTraining(
      {
        resume: resume.trim(),
        jobDescription: jobDescription.trim(),
        lectureText,
        audioPath: "",
      },
      user.id,
    );

    return jsonResponse({ id: training.id, lectureText });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return jsonResponse({ error: error.message }, 503);
    }
    console.error("Could not save training.", error);
    return jsonResponse({ error: "Failed to save your training." }, 500);
  }
}
