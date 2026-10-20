import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ListenInBrowser from "@/app/training/[id]/listen-in-browser";
import { getTraining } from "@/lib/db/trainings";
import { createTrainingAudioUrl } from "@/lib/storage/trainingAudio";
import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  let user;
  try {
    user = await getAuthenticatedUser();
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return (
        <main>
          <h1>Training</h1>
          <p role="alert">{error.message}</p>
        </main>
      );
    }
    throw error;
  }
  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(`/training/${id}`)}`);
  }

  let training;
  try {
    training = await getTraining(id, user.id);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return (
        <main>
          <h1>Training</h1>
          <p role="alert">{error.message}</p>
        </main>
      );
    }
    throw error;
  }

  if (!training) {
    notFound();
  }

  const audioUrl = training.audioPath
    ? await createTrainingAudioUrl(training.audioPath)
    : null;

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <p><Link href="/history">← Training history</Link></p>
      <h1 style={{ margin: "24px 0 8px" }}>Interview training</h1>
      <p style={{ color: "#586158", marginBottom: 28 }}>
        Created {new Date(training.createdAt).toLocaleString()}
      </p>

      {audioUrl ? (
        <section aria-label="Audio training" style={{ marginBottom: 32 }}>
          <audio controls preload="metadata" src={audioUrl}>
            Your browser does not support audio playback.
          </audio>
          <p style={{ marginTop: 10 }}>
            <a
              download="jaydi-training.mp3"
              href={audioUrl}
              style={{ textDecoration: "underline" }}
            >
              Download audio
            </a>
          </p>
        </section>
      ) : (
        <>
          <p
            role="status"
            style={{
              background: "#fbf6ec",
              border: "1px solid #ecdfc4",
              borderRadius: 10,
              color: "#6b5a33",
              marginBottom: 16,
              padding: "12px 16px",
            }}
          >
            Audio narration isn’t stored for this training yet — the written
            lecture is below.
          </p>
          <ListenInBrowser text={training.lectureText} />
        </>
      )}

      <article style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
        {training.lectureText}
      </article>
    </main>
  );
}
