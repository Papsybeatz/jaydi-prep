# Email setup for jaydi.fit

Goal: everything a customer sees comes from `@jaydi.fit`, and Supabase auth
email (confirmation, password reset) actually delivers at volume.

## Why not Gmail's "Send mail as"

Gmail's **Settings → See all settings → Accounts and Import → "Send mail as"**
does exist on a personal account. Do not build on it:

> "Starting January 2027, Gmail will no longer support the 'Send as' feature
> for third-party email addresses, such as @yahoo.com or @outlook.com."
> — Google Workspace / Gmail Help

Anything set up that way stops working within months. Also, mail sent that way
is frequently flagged as `you@gmail.com on behalf of you@jaydi.fit`.

## Two jobs, two services

| Job | What it is | Recommendation |
| --- | --- | --- |
| Reading and replying to customers | A real mailbox on the domain | Google Workspace, Fastmail, or Migadu |
| Sending auth email from Supabase | Transactional SMTP | **Resend** (free tier covers launch) |

Trying to do both with one service is possible but awkward: a mailbox provider's
SMTP is not built for application mail, and a transactional provider is not a
place to read replies.

### Order matters

1. Set up the mailbox first (it changes the domain's MX records).
2. Then add Resend and its DNS records.
3. Then point Supabase at Resend.

---

## Step 1 — A real mailbox at info@jaydi.fit

Pick one. Costs are indicative; check current pricing.

| Provider | Rough cost | Notes |
| --- | --- | --- |
| **Google Workspace Business Starter** | ~$7/user/month | Same Gmail interface you already use. `info@jaydi.fit` becomes a real account, so replies come from it with no alias trickery. Not affected by the 2027 deprecation. |
| **Fastmail** | ~$5/month | Cheaper, excellent deliverability, custom domain included |
| **Migadu** | ~$19/year | Cheapest with real SMTP/IMAP. Plain interface. |

Avoid free tiers that have dropped IMAP/SMTP access — you will need SMTP later
if you ever send from a desktop client.

Once the mailbox exists, forwarding `info@jaydi.fit → jaydi0026@gmail.com` is
no longer needed, because the new mailbox *is* the inbox. You can keep the
forward as a safety net during the transition.

### DNS for Google Workspace

Google gives you the exact values. Typically:

| Type | Name | Value | Priority |
| --- | --- | --- | --- |
| MX | `@` | `smtp.google.com` | 1 |
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` | — |
| TXT | `google._domainkey` | (DKIM key from the Admin console) | — |

Start DKIM in the Admin console: **Apps → Google Workspace → Gmail → Authenticate
email**, generate the key, publish it, then turn on "Authenticate email".

---

## Step 2 — Resend for Supabase auth email

1. Create an account at resend.com.
2. **Domains → Add Domain → `jaydi.fit`**.
3. Choose the region closest to your users.
4. Resend shows the exact DNS records. **Always copy them from the dashboard** —
   the values below are the common shapes, not a substitute.

### The records Resend asks for (classic setup)

| Type | Name | Value | Notes |
| --- | --- | --- | --- |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSq...` | Copy exactly from the dashboard |
| MX | `send` | `feedback-smtp.<region>.amazonses.com` | Priority 10, return-path |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | Subdomain SPF, not the apex |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@jaydi.fit` | Start permissive |

Newer Resend accounts get **three randomised DKIM CNAMEs** instead of the single
TXT. Publish whatever the dashboard shows.

### Notes that cause most failures

- **Never have two SPF TXT records at the same name.** Only one `v=spf1` record
  is allowed. If a provider already put one at `@`, merge the `include:` values
  into a single record.
- **The `send` subdomain is deliberate.** Resend puts its return-path MX and SPF
  on `send.jaydi.fit`, which leaves your root MX free for the mailbox. That is
  why step 1 and step 2 do not conflict.
- **Cloudflare: set these records to DNS only (grey cloud).** A proxied mail
  record will not verify.
- Wait a few minutes, then click **Verify** in Resend. DKIM must pass.

---

## Step 3 — Point Supabase at Resend

Supabase dashboard → **Authentication → Emails → SMTP Settings** (the path has
moved between dashboard versions; it is under Authentication, not Project
Settings).

Toggle **Enable Custom SMTP** and fill in:

| Field | Value |
| --- | --- |
| Host | `smtp.resend.com` |
| Port | `587` (STARTTLS) or `465` (SSL) |
| Username | `resend` — literally the word `resend` |
| Password | Your Resend API key (`re_...`) |
| Sender email | `info@jaydi.fit` |
| Sender name | `Jaydi` |
| Minimum interval per email | `60` seconds |

The sender address **must** be on the domain you verified with Resend, or
messages will be rejected. Save.

---

## Step 4 — Supabase auth settings

**Authentication → URL Configuration**

- Site URL: `https://www.jaydi.fit`
- Redirect URLs, add both:
  - `https://www.jaydi.fit/auth/callback`
  - `http://localhost:3000/auth/callback`

**Authentication → Rate Limits**

Raise the email rate limit above the default. The built-in Supabase mailer caps
at a couple of messages per hour; that cap exists to protect their shared
infrastructure and is why confirmation emails appear to vanish. With Resend
wired up, set this to match your Resend plan (Resend's free tier allows about
100 messages per day, 3,000 per month).

**Authentication → Emails (Templates)**

Optionally restyle the confirmation, recovery, magic link, invite and
email_change templates so they say Jaydi rather than Supabase.

**Authentication → Sign In / Providers**

Decide whether Email confirmation is required. With working SMTP, leaving it on
is the safer default.

---

## Step 5 — Verify it actually works

1. Sign up at `https://www.jaydi.fit/auth` with a real address you can open.
2. Open the confirmation email and check the sender reads `Jaydi <info@jaydi.fit>`.
3. In the received message choose **Show original** (Gmail: ⋮ → Show original)
   and confirm:

```
SPF:   pass
DKIM:  pass
DMARC: pass
```

4. Send a reply to the confirmation and confirm it lands in the mailbox.
5. Reply from the mailbox and confirm the customer sees `info@jaydi.fit`, not a
   Gmail address.

---

## Common failure modes

| Symptom | Cause |
| --- | --- |
| Confirmation never arrives | Custom SMTP not saved, or sender address is not on the verified domain |
| Lands in spam | DKIM not verified, or no DMARC record |
| `dmarc=fail` but `dkim=pass` | The From domain does not align with the signing domain — check the sender address |
| Resend domain stuck on Pending | A record is proxied in Cloudflare, or SPF exists twice at the same name |
| Works for you, not for others | Supabase still on the built-in mailer, which only delivers to project team addresses |
| Auth emails stop after a few | Supabase rate limit or Resend's daily cap |
