import Link from "next/link";
import { redirect } from "next/navigation";
import { listTrainings } from "@/lib/db/trainings";
import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getJobTitle(jobDescription: string): string {
  const lines = jobDescription
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const labeledTitle = lines.find((line) =>
    /^(job title|position|role)\s*:/i.test(line),
  );
  const title = labeledTitle
    ? labeledTitle.replace(/^(job title|position|role)\s*:\s*/i, "")
    : lines[0];

  if (!title) {
    return "Untitled role";
  }
  return title.length > 100 ? `${title.slice(0, 97)}…` : title;
}

export default async function HistoryPage() {
  let user;
  try {
    user = await getAuthenticatedUser();
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return (
        <main>
          <h1>Training history</h1>
          <p role="alert">{error.message}</p>
        </main>
      );
    }
    throw error;
  }
  if (!user) {
    redirect("/auth?next=%2Fhistory");
  }

  let trainings;
  try {
    trainings = await listTrainings(user.id);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return (
        <main>
          <h1>Training history</h1>
          <p role="alert">{error.message}</p>
        </main>
      );
    }
    throw error;
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <p><Link href="/">← New training</Link></p>
      <h1 style={{ margin: "24px 0 8px" }}>Training history</h1>
      <p style={{ color: "#586158", marginBottom: 24 }}>
        Revisit your interview preparation sessions.
      </p>

      {trainings.length === 0 ? (
        <p>No trainings yet. Your completed trainings will appear here.</p>
      ) : (
        <ul style={{ display: "grid", gap: 12, listStyle: "none" }}>
          {trainings.map((training) => (
            <li
              key={training.id}
              style={{
                border: "1px solid #e0e5de",
                borderRadius: 10,
                padding: 18,
              }}
            >
              <Link
                href={`/training/${training.id}`}
                style={{ fontSize: 18, fontWeight: 650 }}
              >
                {getJobTitle(training.jobDescription)}
              </Link>
              <p style={{ color: "#586158", fontSize: 14, marginTop: 8 }}>
                {new Date(training.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
