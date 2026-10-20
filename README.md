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

## Payments: the search-cycle pass

The written lecture is **free**, because a job description can be pasted into a
chat window for nothing. Narration is the paid part: a pass is a one-time
purchase that adds a fixed number of audio narrations to the account. Credits
never expire, because a job search pauses and resumes. Nothing renews, so there
is no subscription to cancel.

Three tiers live in `src/lib/billing/config.ts` and nowhere else:

| Tier | Credits | Price | Per narration | Role |
| --- | --- | --- | --- | --- |
| One interview | 1 | $14 | $14.00 | entry / anchor |
| **Full search** | **3** | **$29** | **$9.67** | **target (highlighted)** |
| Extended search | 6 | $49 | $8.17 | ceiling |

The geometry follows the compromise and decoy effects: the entry tier sits near
half the target and the ceiling near 1.7x, so the middle tier is the obvious
value by price per narration and is the one the layout promotes.

Flow:

1. `/pricing` shows the free tier and the pass, and starts checkout.
2. `POST /api/checkout` creates a Stripe Checkout Session in `payment` mode,
   with `client_reference_id` and `metadata.user_id` set to the account id.
3. Stripe redirects back to `/pricing/success` or `/pricing/cancelled`.
4. `POST /api/stripe/webhook` verifies the `stripe-signature` header against
   the raw body, then inserts a `purchases` row. It runs with the service-role
   key because there is no user session. The unique
   `stripe_checkout_session_id` makes replays idempotent.
5. `POST /api/train` saves the lecture first, then spends one credit through
   the `consume_audio_credit()` RPC and generates the narration. If narration
   fails the credit is refunded through `refund_audio_credit()`, so a provider
   outage never costs a pass.

The gate is on **audio generation**, not on creating a training. An account
without credits still gets its written lecture; it simply gets no stored audio.

### Required configuration

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Creates Checkout Sessions. Use `sk_test_...` until launch |
| `STRIPE_WEBHOOK_SECRET` | Verifies webhook signatures |
| `SUPABASE_SERVICE_ROLE_KEY` | Lets the webhook record a purchase; server-only |
| `NEXT_PUBLIC_SITE_URL` | Absolute origin for the checkout return URLs |
| `PASS_CURRENCY` | Optional, default `usd` |

Prices and credit counts are not environment variables; edit `PASS_TIERS` in
`src/lib/billing/config.ts`.

Set the webhook endpoint in the Stripe dashboard to
`https://<your-domain>/api/stripe/webhook` and subscribe to
`checkout.session.completed`. Locally, forward events with
`stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `LLM_BASE_URL` | Any OpenAI-compatible base URL, ending at `/v1` |
| `LLM_API_KEY` | Key for that endpoint (omit for a local server) |
| `LLM_MODEL` | Model name your provider should run |
| `LLM_PROVIDER` | Optional preset: `groq` or `openai` |
| `GROQ_API_KEY` | Preset key for Groq |
| `OPENAI_API_KEY` | Preset key for OpenAI |
| `TTS_BASE_URL` | Speech endpoint base (default `https://api.openai.com/v1`) |
| `TTS_API_KEY` | Speech key (omit for a local server) |
| `TTS_MODEL` | Optional speech model override (default `tts-1`) |
| `TTS_VOICE` | Optional speech voice override (default `alloy`) |
| `TTS_FORMAT` | Must be `mp3` (default); other formats are refused |
## Choosing an AI provider

Jaydi is not tied to one vendor. Lecture text goes to any provider that speaks
the OpenAI chat-completions dialect, which covers most open-source model hosts
as well as the vendors themselves. Set one of these setups:

**A. Any OpenAI-compatible endpoint (recommended)**

```
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=...
LLM_MODEL=meta-llama/llama-3.3-70b-instruct
```

`LLM_BASE_URL` should stop at the version segment (`/v1`); the app appends
`/chat/completions`. A local server such as Ollama or vLLM needs no
`LLM_API_KEY`. Hosts that work this way include OpenRouter, Together AI,
Fireworks, DeepInfra, Cerebras, Hugging Face, Ollama, vLLM and LocalAI.

**B. A named preset**

```
LLM_PROVIDER=groq      # or openai
GROQ_API_KEY=...       # or OPENAI_API_KEY
```

Selection order is `LLM_BASE_URL` → `LLM_PROVIDER` → `OPENAI_API_KEY` →
`GROQ_API_KEY`. `LLM_MODEL` overrides the provider default.

### Use a dedicated key for this app

Do **not** reuse a key that already runs another product. A shared key shares
its rate limit, its daily quota, its bill, and its blast radius if it leaks —
a spike in one app will starve the other, and revoking it to fix that breaks
both. Issue a separate key for Jaydi, even to the same provider.

Smaller open models are cheap but write noticeably thinner lectures, so pick a
model with real instruction-following strength for this task.

### Audio narration

`TTS_BASE_URL` defaults to `https://api.openai.com/v1`; point it at any
OpenAI-compatible speech server (Kokoro-FastAPI, openedai-speech, LocalAI,
Speaches) to self-host. Joining chunks into one file only works for MP3, so
`TTS_FORMAT` must be `mp3`; the app refuses other formats rather than writing
corrupt audio.

Groq also hosts text-to-speech (Canopy Labs Orpheus), but it caps input at
**200 characters** — roughly 75 requests for one lecture — returns WAV only,
and costs $22/1M characters. It is not a good fit for long-form narration.

When no speech provider is configured, the training page reads the lecture
aloud with the device's own voice, so listening works at zero cost.

Without Supabase configuration, sign-in shows a setup error, protected data
pages show a configuration message, and API requests return a configuration
error. When no lecture provider is configured, training creation returns a
clear configuration error instead of saving placeholder text. When speech
fails, the training is saved with its lecture and the page offers device
narration instead.
