import { saveTraining, setTrainingAudioPath } from "@/lib/db/trainings";
import { consumeAudioCredit, getAudioCredits, refundAudioCredit } from "@/lib/db/purchases";
import {
  LectureConfigurationError,
  LectureGenerationError,
} from "@/lib/ai/generateLecture";
import {
  createTrainingAudioUrl,
  trainingAudioPath,
  uploadTrainingAudio,
} from "@/lib/storage/trainingAudio";
import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { getAuthenticatedUser } from "@/lib/supabase/server";

// A lecture plus multiple speech chunks can exceed the default function
// timeout. Hobby caps at 60s; raise this on a Pro plan for long narration.
export const maxDuration = 60;

type TrainResponse =
  | {
      id: string;
      lectureText: string;
      audioUrl: string | null;
      audioError: string | null;
      audioLocked: boolean;
    }
  | { error: string };

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

  // The written lecture is free. It is saved before any paid work so a credit
  // or provider problem can never cost the user their document.
  let training;
  try {
    training = await saveTraining(
      {
        resume: resume.trim(),
        jobDescription: jobDescription.trim(),
        lectureText,
        audioPath: "",
      },
      user.id,
    );
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return jsonResponse({ error: error.message }, 503);
    }
    console.error("Could not save training.", error);
    return jsonResponse({ error: "Failed to save your training." }, 500);
  }

  let audioUrl: string | null = null;
  let audioError: string | null = null;
  let audioLocked = false;

  // Narration is the paid part. A pass is spent here, one credit per lecture.
  let availableCredits = 0;
  try {
    availableCredits = await getAudioCredits();
  } catch (error) {
    // A missing purchases table should degrade to the free tier, not fail the
    // request: the lecture has already been saved.
    console.error("Could not read audio credits; treating as free tier.", error);
  }

  if (availableCredits <= 0) {
    audioLocked = true;
  } else {
    let chargedPurchaseId: string | null = null;
    try {
      chargedPurchaseId = await consumeAudioCredit();
    } catch (error) {
      console.error("Could not consume an audio credit.", error);
    }

    if (!chargedPurchaseId) {
      audioLocked = true;
    } else {
      try {
        const { generateAudio } = await import("@/lib/tts/generateAudio");
        const audio = await generateAudio(lectureText);
        const path = trainingAudioPath(user.id, training.id);
        await uploadTrainingAudio(path, audio.data, audio.contentType);
        await setTrainingAudioPath(training.id, user.id, path);
        audioUrl = await createTrainingAudioUrl(path);
      } catch (error) {
        audioError =
          error instanceof Error ? error.message : "Audio could not be generated.";
        console.error(`Audio generation failed for training ${training.id}.`, error);
        // The user paid a credit and got nothing, so give it back.
        await refundAudioCredit(chargedPurchaseId);
      }
    }
  }

  return jsonResponse({
    id: training.id,
    lectureText,
    audioUrl,
    audioError,
    audioLocked,
  });
}
