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

Install dependencies and log in once with your API key:

```bash
cd collector
npm install
npm link                # exposes a global `devmeter` command
devmeter login <api_key> --api-url https://<your-deployment>.vercel.app
```

Then, inside any project you want to track:

```bash
cd /path/to/your/project
devmeter start
```

`devmeter start` prints the environment variables to export in that same
terminal so Claude Code reports telemetry to the local collector:

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=http/json
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export OTEL_METRIC_EXPORT_INTERVAL=10000
export OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE=delta
```

Work normally with `claude` in that terminal. Run `devmeter status` in
another terminal to see the running session's tokens and estimated cost.
Press **Ctrl+C** in the `devmeter start` terminal to close the session — it
is sent to DevMeter and shows up on the dashboard immediately, tagged with
the current git branch (and a ticket ref auto-extracted from it, e.g.
`fix/TICKET-148-...` → `TICKET-148`).

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
