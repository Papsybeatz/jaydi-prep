import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Lecture audio lives in a private Supabase Storage bucket instead of the
 * database. Rows store the object path; playback uses short-lived signed URLs
 * so a training's audio is never publicly addressable.
 */
export const TRAINING_AUDIO_BUCKET = "training-audio";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export function trainingAudioPath(userId: string, trainingId: string): string {
  return `${userId}/${trainingId}.mp3`;
}

export async function uploadTrainingAudio(
  path: string,
  data: Buffer,
  contentType: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage
    .from(TRAINING_AUDIO_BUCKET)
    .upload(path, data, { contentType, upsert: true });

  if (error) {
    throw error;
  }
}

export async function createTrainingAudioUrl(path: string): Promise<string | null> {
  if (!path) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(TRAINING_AUDIO_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("Could not create a signed URL for training audio.", error);
    return null;
  }

  return data?.signedUrl ?? null;
}

export async function removeTrainingAudio(path: string): Promise<void> {
  if (!path) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from(TRAINING_AUDIO_BUCKET).remove([path]);

  if (error) {
    console.error("Could not remove training audio.", error);
  }
}
