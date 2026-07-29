# Working agreement for this repo

- Commit and push directly to `main` when the user asks for a commit/push —
  no need to re-confirm each time. This is a solo project, low stakes.
- After any UI/frontend change, smoke-test it for real: start the dev
  server (`npm run dev` in `web/`) and use `claude-in-chrome` to click
  through the affected pages before calling the work done. Don't rely on
  `tsc`/`eslint`/`next build` passing alone as proof the feature works.
- `web/.env` holds the real Neon connection string (same DB used by
  production — there's no separate dev/staging database). Running
  `prisma migrate dev` here applies directly to prod. Clean up any
  test accounts/sessions created during manual testing afterward.
- Vercel deploys are triggered by pushing to `main` (GitHub integration).
  After pushing, poll `vercel ls` / `vercel inspect --logs` until the
  build finishes instead of assuming it succeeded.
