# DevMeter

Tracks time and Claude Code AI cost per ticket/project for freelancers and
small agencies, so you know what a mission really cost.

Two packages:

- **`web/`** — Next.js 16 app (dashboard, auth, API) deployed on Vercel.
- **`collector/`** — local CLI that listens to Claude Code's OpenTelemetry
  metrics and reports sessions to the web app.

## Prerequisites

- Node.js **22.6+** (24 recommended) — the collector runs TypeScript
  natively, no build step.
- A free [Neon](https://neon.tech) Postgres database.
- A free [Vercel](https://vercel.com) account.

## 1. Run the web app locally

```bash
cd web
npm install
cp .env.example .env
```

Edit `web/.env`:

- `DATABASE_URL` — from Neon: Dashboard → Connect → **pooled connection**
  string.
- `AUTH_SECRET` — generate with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

Create the tables and start the dev server:

```bash
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000, create an account, and go to **Settings** to
generate your API key (shown once — copy it).

## 2. Deploy to Vercel

This is a monorepo, so the Vercel project's **Root Directory** must be set to
`web`:

```bash
vercel link            # first time: set Root Directory to "web" when asked,
                        # or set it later in Project Settings → General
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
vercel --prod
```

Run `npx prisma migrate deploy` (with `DATABASE_URL` pointed at the same Neon
database) once after the first deploy to apply migrations there too.

## 3. Track a real project with the collector

Setting up a **new machine**? Paste [`SETUP_NEW_MACHINE.md`](SETUP_NEW_MACHINE.md)
into a fresh Claude Code session there and it'll do the rest.

One-time setup on a machine (never needs repeating after this):

```bash
cd collector
npm install
npm link                # exposes a global `devmeter` command
devmeter login <api_key> --api-url https://<your-deployment>.vercel.app
```

### Recommended: `devmeter claude`

Run this instead of `claude` directly, from inside the project you're
working on:

```bash
cd /path/to/your/project
devmeter claude
```

It launches `claude` (any arguments, e.g. `devmeter claude --resume <id>`,
pass through normally) with a dedicated local OTLP receiver for just that
session, tagged to the current directory by construction — no shared
state, no risk of tokens landing on the wrong project even if you switch
directories between sessions. When `claude` exits, the session is sent to
DevMeter automatically.

To stop typing `devmeter claude` every time, shadow `claude` in your shell
profile so plain `claude` does it for you:

**PowerShell** (`$PROFILE` — create it first with
`New-Item -ItemType File -Path $PROFILE -Force` if it doesn't exist):

```powershell
function claude {
    devmeter claude @args
}
```

**bash/zsh** (`~/.bashrc` / `~/.zshrc`):

```bash
claude() { devmeter claude "$@"; }
```

Open a new terminal afterward for the shell to pick it up.

### Alternative: `devmeter start`

A persistent collector you leave running in one terminal, with Claude Code
pointed at it manually in others. Simpler mentally, but every session run
while it's up is attributed to **wherever `devmeter start` itself was
launched from** — not wherever `claude` runs — since Claude Code's OTLP
export carries no directory info of its own.

```bash
cd /path/to/your/project
devmeter start
```

It prints the environment variables to export in another terminal before
running `claude` there. Run `devmeter status` to see all currently
in-progress sessions. Press **Ctrl+C** to stop and flush them to DevMeter.

### Either way

Sessions are tagged with the current git branch (and a ticket ref
auto-extracted from it, e.g. `fix/TICKET-148-...` → `TICKET-148`), and show
up on the dashboard as soon as the session ends.

## Data model

- `User` — email/password, hourly rate, hashed API key.
- `Project` — one per client/repo, auto-created by the collector on first
  ingest (matched by name) or manually from the dashboard.
- `Session` — one row per collector run: git branch, ticket ref, start/end
  time, token counts, estimated AI cost.

## Updating AI pricing

`collector/pricing.json` holds $/million-token rates per model tier
(sonnet/opus/haiku). Anthropic pricing changes over time — check
https://www.anthropic.com/pricing and update this file; no code changes
needed.
