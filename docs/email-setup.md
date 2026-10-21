# Email setup for jaydi.fit

Goal: everything a customer sees comes from `@jaydi.fit`, and Supabase auth
email (confirmation, password reset) actually delivers at volume.

## Why not Gmail's "Send mail as"

Gmail's **Settings → See all settings → Accounts and Import → "Send mail as"**
does exist on a personal account. Do not build on it:

> "Starting January 2027, Gmail will no longer support the 'Send as' feature
> for third-party email addresses, such as @yahoo.com or @outlook.com."
> — Gmail Help

Anything set up that way stops working within months. Mail sent that way is
also frequently flagged as `you@gmail.com on behalf of you@jaydi.fit`.

## Two jobs, two services

| Job | What it needs | Notes |
| --- | --- | --- |
| Reading and replying to customers | A real mailbox on the domain | Every SMTP relay below is **send-only**: no inbox |
| Sending auth email from Supabase | Transactional SMTP | Brevo or Resend |

**No transactional provider gives you an inbox.** Brevo, Resend, SendGrid and
Postmark all send only. Receiving requires a mailbox from a mail host.

### Order matters

1. Set up the mailbox first (it changes the domain's MX records).
2. Then authenticate the sending domain with Brevo or Resend.
3. Then point Supabase at that SMTP relay.

---

## Step 1 — A real mailbox at info@jaydi.fit

| Provider | Rough cost | Notes |
| --- | --- | --- |
| **Google Workspace Business Starter** | ~$7/user/month | Same Gmail interface. `info@jaydi.fit` becomes a real account, so replies come from it with no alias trickery. Unaffected by the 2027 deprecation. Replaces your current forwarding. |
| **Fastmail** | ~$5/month | Cheaper, strong deliverability, custom domain included |
| **Zoho Mail Lite** | ~$1/user/month | Cheapest mainstream option with IMAP/SMTP |
| **Migadu** | ~$19/year | Very cheap, real IMAP/SMTP, plain interface |

Avoid free tiers that have dropped IMAP/SMTP access.

Once the mailbox exists, forwarding `info@jaydi.fit → jaydi0026@gmail.com` is no
longer needed, because the new mailbox *is* the inbox. Keep the forward as a
safety net until you have received a test message.

### DNS for a mailbox

Every provider gives you exact values. Typically:

| Type | Name | Value | Priority |
| --- | --- | --- | --- |
| MX | `@` | `smtp.google.com` (Workspace) or your host's MX | 1 |
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` | — |
| TXT | `google._domainkey` | DKIM key from the admin console | — |

---

## Step 2 — Choose the sending relay

| | **Brevo** | **Resend** |
| --- | --- | --- |
| Already have an account | ✅ (used for TGM) | No |
| Free allowance | **300 / day** (resets daily, no rollover) | ~3,000 / month, ~100 / day |
| Host | `smtp-relay.brevo.com` | `smtp.resend.com` |
| Ports | 587 (STARTTLS), 465 (SSL), 2525 | 587 (STARTTLS), 465 (SSL) |
| Username | The SMTP login shown on Brevo's SMTP page | literally `resend` |
| Password | **SMTP key** (not the API key) | API key (`re_...`) |
| Domain auth records | Brevo code TXT + DKIM + DMARC | DKIM + SPF/return-path + DMARC |
| Mailbox included | ❌ send-only | ❌ send-only |

Both work with Supabase. Brevo's daily ceiling is *higher* than Resend's free
daily ceiling, so for auth email either is sufficient at launch.

### Do not share one account across two products

The same reasoning you applied to the AI key applies here. Sharing one Brevo
account between TGM and Jaydi shares:

- the 300/day quota (a TGM burst starves Jaydi sign-ups),
- the account's sending reputation and suspension risk,
- the blast radius if a credential leaks.

**Recommended:** create a **second free Brevo account** for Jaydi. It costs
nothing and fully isolates the two.

If you would rather keep one account, then at minimum:

1. Add `jaydi.fit` as a separate domain under **Senders, Domains, IPs → Domains**.
2. Create a **dedicated SMTP key** for Jaydi under **SMTP & API → SMTP**
   (never reuse TGM's key).
3. Accept the shared quota and shared suspension risk.

Brevo supports multiple sending domains on one account, each configured
independently.

---

## Step 3 — Authenticate the domain with Brevo

1. Brevo → **Settings → Senders, Domains, IPs → Domains → Add a domain**.
2. Enter `jaydi.fit`, choose **Authenticate the domain yourself**.
3. Brevo shows the exact DNS records — **copy them, do not retype**.

Typical set:

| Type | Name | Value | Purpose |
| --- | --- | --- | --- |
| TXT | `@` | `brevo-code:xxxxxxxx` | Proves you own the domain |
| TXT | `mail._domainkey` | `v=DKIM1; k=rsa; p=MIGf...` | DKIM signing (or 2 CNAMEs for a 2048-bit key) |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@jaydi.fit` | DMARC reporting |

Notes:

- **SPF and MX are not required** by Brevo for domain authentication. Brevo only
  asks for those when you move to a dedicated IP, because on shared
  infrastructure it handles return-path itself.
- **One SPF record, maximum.** If the mailbox provider already published one at
  `@`, merge the `include:` values rather than adding a second record.
- **One DMARC record, maximum.** Update the existing one instead of adding a
  second.
- **Cloudflare: set these to DNS only (grey cloud).** A proxied mail record will
  not verify.
- If the domain is not authenticated, Brevo **replaces your sender address** with
  a compliant one — mail still sends, but it will not look like you.

Then generate the SMTP credentials: **Settings → SMTP & API → SMTP → Create a new
SMTP key**. Copy the login shown on that page; depending on account age it is
either your login email or an address like `[ID]@smtp-brevo.com`.

---

## Step 4 — Point Supabase at the relay

Supabase dashboard → **Authentication → Emails → SMTP Settings** (under
Authentication, not Project Settings). Toggle **Enable Custom SMTP**.

**Brevo:**

| Field | Value |
| --- | --- |
| Host | `smtp-relay.brevo.com` |
| Port | `587` (STARTTLS) or `465` (SSL) |
| Username | The SMTP login from Brevo's SMTP page |
| Password | The **SMTP key**, not the API key |
| Sender email | `info@jaydi.fit` |
| Sender name | `Jaydi` |
| Minimum interval per email | `60` seconds |

**Resend:**

| Field | Value |
| --- | --- |
| Host | `smtp.resend.com` |
| Port | `587` or `465` |
| Username | `resend` — literally that word |
| Password | API key (`re_...`) |
| Sender email | `info@jaydi.fit` |
| Sender name | `Jaydi` |
| Minimum interval per email | `60` seconds |

The sender address **must** be on the authenticated domain, or messages are
rejected or rewritten.

---

## Step 5 — Supabase auth settings

**Authentication → URL Configuration**

- Site URL: `https://www.jaydi.fit`
- Redirect URLs, add both:
  - `https://www.jaydi.fit/auth/callback`
  - `http://localhost:3000/auth/callback`

**Authentication → Rate Limits**

Raise the email rate limit above the default. The built-in Supabase mailer caps
at a couple of messages per hour; that cap is why confirmation emails appear to
vanish. With a real relay configured, set it to match the provider
(Brevo free: 300/day; Resend free: ~100/day).

**Authentication → Emails (Templates)**

Optionally restyle confirmation, recovery, magic link, invite and email_change
so they say Jaydi rather than Supabase.

---

## Step 6 — Verify it actually works

1. Sign up at `https://www.jaydi.fit/auth` with a real address you can open.
2. The sender should read `Jaydi <info@jaydi.fit>`.
3. Gmail → ⋮ → **Show original** and confirm:

```
SPF:   pass
DKIM:  pass
DMARC: pass
```

4. Reply to that email and confirm it reaches the mailbox.
5. Reply from the mailbox and confirm the customer sees `info@jaydi.fit`.

---

## Common failure modes

| Symptom | Cause |
| --- | --- |
| `535` auth failure | Using the API key instead of the SMTP key, or `smtp-relay.brevo.com` typed into the username field |
| Confirmation never arrives | Custom SMTP not saved, or sender address is not on the authenticated domain |
| Sender is not what you set | Domain not authenticated, so Brevo substituted a compliant address |
| Lands in spam | DKIM not verified, or no DMARC record |
| `dmarc=fail` but `dkim=pass` | Sender domain does not align with the authenticated domain |
| Domain stuck on Pending | Record proxied in Cloudflare, or two SPF/DMARC records at the same name |
| Works for you, not for others | Still on the built-in Supabase mailer, which only delivers to project team addresses |
| Stops after a burst | Daily cap reached (Brevo 300/day, Resend ~100/day) |
