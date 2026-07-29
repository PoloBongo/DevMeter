---
name: e2e-collector-test
description: Manually verify the full DevMeter flow end-to-end — register, API key, collector CLI, OTLP ingestion, dashboard. Use after changes touching auth, the ingest API, the collector, or pricing/dashboard queries.
---

# End-to-end collector test

Verifies: register/login → API key → collector CLI → OTLP receiver →
`/api/sessions/ingest` → dashboard display.

## Steps

1. Start the app: `cd web && npm run dev` (uses the real Neon DB — same
   one production uses, there's no separate dev database).
2. Register a throwaway test account (e.g. `smoketest@devmeter.local`) via
   the browser (`claude-in-chrome`) or `curl -X POST /api/sessions/ingest`
   directly with a manually-crafted payload if you just need to check
   dashboard rendering, not the full collector.
3. Generate an API key from Settings.
4. Either:
   - Run the real collector: `cd collector && npm link && devmeter login
     <key> --api-url http://localhost:3000`, then `devmeter start`, set the
     `$env:CLAUDE_CODE_ENABLE_TELEMETRY` etc. vars it prints in another
     terminal, run `claude` there and have a short exchange, then Ctrl+C
     the collector to flush.
   - Or skip the CLI and POST straight to `/api/sessions/ingest` with a
     `Bearer <key>` header and a plausible payload (see
     `web/app/api/sessions/ingest/route.ts` for the schema) — faster when
     only testing dashboard/pricing logic, not the collector itself.
5. Check the dashboard and project detail page render the session
   correctly (duration, tokens, AI cost, total cost per the active pricing
   mode).

## Cleanup

Delete the test account afterward — it's real prod data, not a sandbox:

```js
// web/scratch-cleanup.mjs (delete after running)
import "dotenv/config";
import { Client } from "pg";
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query('DELETE FROM "User" WHERE email = $1', ["smoketest@devmeter.local"]);
await client.end();
```

Run with `node web/scratch-cleanup.mjs`, then delete the script. Sessions
and projects cascade-delete with the user.
