# devmeter-cli

[![npm version](https://img.shields.io/npm/v/devmeter-cli?color=cb3837&logo=npm)](https://www.npmjs.com/package/devmeter-cli)
[![npm downloads](https://img.shields.io/npm/dm/devmeter-cli?color=cb3837&logo=npm)](https://www.npmjs.com/package/devmeter-cli)
[![node](https://img.shields.io/node/v/devmeter-cli?color=5fa04e&logo=node.js)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/devmeter-cli?color=blue)](./LICENSE)

Local collector for **[DevMeter](https://devmeter-pi.vercel.app)** — it listens
to Claude Code's OpenTelemetry stream and reports, per project and per session:

- ⏱️ **time spent** (wall-clock, per git branch)
- 🪙 **token usage** — input / output / cache-read / cache-write, split by model
- 💸 **estimated AI cost** in USD, from a bundled per-model price table
- 🎫 **ticket ref** auto-extracted from the branch name (`fix/ABC-123-…` → `ABC-123`)

Sessions show up on your DevMeter dashboard as soon as they end.

## Requirements

- **Node.js 22.6+** (24 recommended) — the CLI runs on native TypeScript type-stripping
- **[Claude Code](https://docs.claude.com/en/docs/claude-code)** on your `PATH`
- A DevMeter account — free at [devmeter-pi.vercel.app](https://devmeter-pi.vercel.app)

## Quick start

```bash
npm install -g devmeter-cli
devmeter login <api_key>
```

Get `<api_key>` from your dashboard → **Settings → Local collector**.

> `login` targets `https://devmeter-pi.vercel.app` by default. Pass
> `--api-url <url>` (or set `DEVMETER_API_URL`) only to point at your own
> DevMeter deployment or a local dev server.

Then, from inside the project you're working on, run Claude Code through the
collector:

```bash
cd /path/to/your/project
devmeter claude
```

That's it. `devmeter claude` launches `claude` with a dedicated local OTLP
receiver scoped to **that one session**, tagged to the current directory — so
tokens always land on the right project, even if you run several sessions from
different folders at once. Any arguments pass straight through
(`devmeter claude --resume <id>`, `devmeter claude -p "…"`, …). When `claude`
exits, the session is pushed to DevMeter automatically.

### Make it transparent

Shadow `claude` in your shell profile so you never have to think about it:

**PowerShell** (`$PROFILE`):

```powershell
function claude { devmeter claude @args }
```

**bash / zsh** (`~/.bashrc` / `~/.zshrc`):

```bash
claude() { devmeter claude "$@"; }
```

Open a new terminal and use `claude` exactly as before.

## Commands

| Command | What it does |
| --- | --- |
| `devmeter login <api_key>` | Save your API key + API URL to `~/.devmeter/config.json` |
| `devmeter claude [args…]` | Run `claude` for one directory-tagged, self-contained tracked session (**recommended**) |
| `devmeter start` | Run a persistent collector in one terminal; point Claude Code at it from others |
| `devmeter status` | Show in-progress sessions — elapsed time, token counts, cost so far |
| `devmeter sync` | Push in-progress session(s) to DevMeter right now, without ending them |
| `devmeter --version` | Print the installed version |

### `devmeter start` (manual alternative)

A long-lived collector you leave running in one terminal. It prints the
OpenTelemetry env vars to export in another terminal before you launch `claude`
there. Every session run while it's up is attributed to **wherever
`devmeter start` itself was launched from** — not wherever `claude` runs — so
`devmeter claude` is usually the better choice. Press **Ctrl+C** to stop and
flush any in-progress sessions.

## How attribution works

Claude Code's telemetry export carries no directory information of its own.
`devmeter claude` solves this by spinning up an ephemeral-port OTLP receiver per
invocation and recording the directory it was started in, so each session is
pinned to its real project with no shared global state.

Pricing lives in [`pricing.json`](./pricing.json) as $/million-token rates per
model tier (sonnet / opus / haiku). Anthropic's rates change over time — check
<https://www.anthropic.com/pricing> and edit that file; no code change needed.

## License

MIT
