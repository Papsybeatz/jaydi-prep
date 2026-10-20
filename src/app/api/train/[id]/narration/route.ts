import { getTraining, setTrainingAudioPath } from "@/lib/db/trainings";
import { consumeAudioCredit, refundAudioCredit } from "@/lib/db/purchases";
import {
  createTrainingAudioUrl,
  trainingAudioPath,
  uploadTrainingAudio,
} from "@/lib/storage/trainingAudio";
import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { TtsConfigurationError } from "@/lib/tts/generateAudio";

export const runtime = "nodejs";
// Narration may need several speech requests; Hobby caps at 60s.
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Spend one credit to narrate an existing training. This is the only place a
 * credit is ever consumed, so the user always chooses which role gets audio.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  if (!UUID.test(id)) {
    return Response.json({ error: "Training not found." }, { status: 404 });
  }

  let user;
  try {
    user = await getAuthenticatedUser();
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    console.error("Could not validate session for narration.", error);
    return Response.json({ error: "Could not verify your session." }, { status: 500 });
  }
  if (!user) {
    return Response.json({ error: "Sign in to narrate a training." }, { status: 401 });
  }

  let training;
  try {
    training = await getTraining(id, user.id);
  } catch (error) {
    console.error("Could not load the training for narration.", error);
    return Response.json({ error: "Could not load this training." }, { status: 500 });
  }
  if (!training) {
    return Response.json({ error: "Training not found." }, { status: 404 });
  }

  // Already narrated: return a fresh link instead of charging again, so a
  // double-click or a retry after a network blip is harmless.
  if (training.audioPath) {
    const audioUrl = await createTrainingAudioUrl(training.audioPath);
    if (audioUrl) {
      return Response.json({ audioUrl, creditsCharged: 0 });
    }
  }

  let purchaseId: string | null = null;
  try {
    purchaseId = await consumeAudioCredit();
  } catch (error) {
    console.error("Could not consume an audio credit.", error);
    return Response.json(
      { error: "Could not check your credits. Please try again." },
      { status: 500 },
    );
  }

  if (!purchaseId) {
    return Response.json(
      {
        error:
          "You have no narration credits. Buy a pass to add audio to this training.",
        needsPass: true,
      },
      { status: 402 },
    );
  }

  try {
    const { generateAudio } = await import("@/lib/tts/generateAudio");
    const audio = await generateAudio(training.lectureText);
    const path = trainingAudioPath(user.id, training.id);
    await uploadTrainingAudio(path, audio.data, audio.contentType);
    await setTrainingAudioPath(training.id, user.id, path);
    const audioUrl = await createTrainingAudioUrl(path);

    if (!audioUrl) {
      throw new Error("The audio was stored but no playback link could be created.");
    }

    return Response.json({ audioUrl, creditsCharged: 1 });
  } catch (error) {
    // The user paid a credit and got nothing, so give it back.
    await refundAudioCredit(purchaseId);

    if (error instanceof TtsConfigurationError) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    const message =
      error instanceof Error ? error.message : "Audio could not be generated.";
    console.error(`Narration failed for training ${training.id}.`, error);
    return Response.json(
      { error: `${message} Your credit was returned.` },
      { status: 502 },
    );
  }
}
