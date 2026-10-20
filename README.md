# Jaydi

Jaydi turns a resume and a job description into interview preparation, with
generated lecture text and optional audio.

## Getting started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set the Supabase project URL and anon key in `.env.local`.
4. Run all SQL migrations, in timestamp order, from `supabase/migrations/`
   using the Supabase SQL Editor. The final migration creates the private
   `training-audio` storage bucket and its per-user policies.
5. In Supabase Auth settings, enable email sign-in and add the local and
   production `/auth/callback` URLs to the allowed redirect URLs.
6. Start the app with `npm run dev`.

The Supabase URL and anon key are available in the project API settings. The
anon key is intended for public clients; do not put a Supabase service-role key
in this app's environment.

## Slice 2 data access

The initial migration creates `public.trainings`. The follow-up migration adds
`user_id`, revokes anonymous table access, and grants authenticated users
row-level access only to their own trainings. The app validates sessions on the
server for both training APIs, the history page, and training detail pages.

Existing trainings created before authentication have no owner. They remain in
the database but are inaccessible through the app and RLS; the migration does
not assign them to a user or delete them.

Users must sign in before uploading a resume or creating a training.
`POST /api/train` accepts `resume` and `jobDescription` and returns the saved
training's `id`, `lectureText`, a signed `audioUrl`, and `audioError`. Visit
`/history` to see only your sessions and `/training/[id]` to revisit one.

## Lecture audio

Lecture audio is stored in the private `training-audio` Supabase Storage
bucket as `<user_id>/<training_id>.mp3`, never in the database. Rows hold the
object path in `trainings.audioPath`; playback resolves a one-hour signed URL
on demand. RLS restricts every object to its owner.

Long lectures exceed the speech service's per-request character limit, so the
lecture is narrated in sentence-aligned chunks and the MP3 parts are joined
with their ID3v2 tags stripped. If speech generation or upload fails, the
training is still saved with its written lecture and `audioError` explains
what happened.

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
| `GROQ_API_KEY` | Lecture generation via Groq (free tier: 8K TPM / 200K TPD) |
| `OPENAI_API_KEY` | Lecture generation via OpenAI, and the default speech key |
| `LLM_PROVIDER` | Optional: `groq` or `openai`. Auto-detected when unset |
| `LLM_MODEL` | Optional chat model override (defaults per provider) |
| `TTS_API_KEY` | Required for stored audio narration |
| `TTS_MODEL` | Optional speech model override (default `tts-1`) |
| `TTS_VOICE` | Optional speech voice override (default `alloy`) |

Lecture text needs **one** of `GROQ_API_KEY` or `OPENAI_API_KEY`; when both
are present OpenAI is preferred because it also unlocks speech. Groq is
fast and cheap but has **no speech endpoint**, so it cannot produce audio.

Without Supabase configuration, sign-in shows a setup error, protected data
pages show a configuration message, and API requests return a configuration
error. When no lecture key is present, training creation returns a clear
configuration error instead of saving placeholder text. When `TTS_API_KEY` is
missing or speech fails, the training is saved with its lecture, and the
training page offers to read the lecture aloud using the device's own voice
so listening still works at zero cost.
