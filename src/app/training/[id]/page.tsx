import Link from "next/link";
import { notFound } from "next/navigation";
import { getTraining } from "@/lib/db/trainings";
import { SupabaseConfigurationError } from "@/lib/db/supabase";

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

  let training;
  try {
    training = await getTraining(id);
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

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <p><Link href="/history">← Training history</Link></p>
      <h1 style={{ margin: "24px 0 8px" }}>Interview training</h1>
      <p style={{ color: "#586158", marginBottom: 28 }}>
        Created {new Date(training.createdAt).toLocaleString()}
      </p>

      {training.audioUrl && (
        <section aria-label="Audio training" style={{ marginBottom: 32 }}>
          <audio controls preload="metadata" src={training.audioUrl}>
            Your browser does not support audio playback.
          </audio>
          <p style={{ marginTop: 10 }}>
            <a
              download="jaydi-training.mp3"
              href={training.audioUrl}
              style={{ textDecoration: "underline" }}
            >
              Download audio
            </a>
          </p>
        </section>
      )}

      <article style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
        {training.lectureText}
      </article>
    </main>
  );
}
