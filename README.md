# Jaydi

Jaydi turns a resume and a job description into interview preparation, with
generated lecture text and optional audio.

## Getting started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set the Supabase project URL and anon key in `.env.local`.
4. Run the SQL migration in `supabase/migrations/20261017000000_create_trainings.sql`
   using the Supabase SQL Editor.
5. Start the app with `npm run dev`.

The Supabase URL and anon key are available in the project API settings. The
anon key is intended for public clients; do not put a Supabase service-role key
in this app's environment.

## Slice 2 data access

The migration creates `public.trainings` and grants the anonymous Supabase role
permission to insert and read training rows so the API and history pages work
without accounts.

**This no-auth setup is shared and public:** anyone who can reach the app can
create trainings and read every saved resume, job description, lecture, and
audio URL. Do not use real personal data in a public deployment until
authentication and per-user row-level security are added.

`POST /api/train` accepts `resume` and `jobDescription` and returns the saved
training's `id`, `lectureText`, and `audioUrl`. Visit `/history` to see saved
sessions and `/training/[id]` to revisit one.

On the home page, upload a PDF or DOCX resume (up to 4 MB) to extract and
preview its text in the editable resume field. Scanned/image-only PDFs are not
OCR processed and need a text-based PDF or DOCX. The upload parsing endpoint
does not save the file; submitting a training still saves the resume text as
described above.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `OPENAI_API_KEY` | Optional key for lecture generation |
| `TTS_API_KEY` | Optional key for audio generation |

Without Supabase configuration, pages show a setup message and training
generation returns a configuration error rather than claiming an unsaved
training succeeded. Lecture and audio generation retain their existing
fallback behavior when their respective API keys are absent.
