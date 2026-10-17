import { getSupabaseClient } from "@/lib/db/supabase";

export type Training = {
  id: string;
  resume: string;
  jobDescription: string;
  lectureText: string;
  audioUrl: string;
  createdAt: string;
};

export type NewTraining = Omit<Training, "id" | "createdAt">;

export async function saveTraining(training: NewTraining): Promise<Training> {
  const { data, error } = await getSupabaseClient()
    .from("trainings")
    .insert(training)
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

export async function listTrainings(): Promise<Training[]> {
  const { data, error } = await getSupabaseClient()
    .from("trainings")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("Supabase did not return the training history.");
  }

  return data;
}

export async function getTraining(id: string): Promise<Training | null> {
  const { data, error } = await getSupabaseClient()
    .from("trainings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
