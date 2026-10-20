import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Training = {
  id: string;
  user_id: string | null;
  resume: string;
  jobDescription: string;
  lectureText: string;
  audioPath: string;
  createdAt: string;
};

export type NewTraining = {
  resume: string;
  jobDescription: string;
  lectureText: string;
  audioPath: string;
};

export async function saveTraining(
  training: NewTraining,
  userId: string,
): Promise<Training> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trainings")
    .insert({ ...training, user_id: userId })
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("Supabase did not return the saved training.");
  }

  return data;
}

export async function setTrainingAudioPath(
  id: string,
  userId: string,
  audioPath: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("trainings")
    .update({ audioPath })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function listTrainings(userId: string): Promise<Training[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trainings")
    .select("*")
    .eq("user_id", userId)
    .order("createdAt", { ascending: false });

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("Supabase did not return the training history.");
  }

  return data;
}

export async function getTraining(
  id: string,
  userId: string,
): Promise<Training | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("trainings")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
