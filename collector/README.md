# devmeter-cli

Local collector for [DevMeter](https://devmeter-pi.vercel.app) — listens to
Claude Code's OpenTelemetry metrics and reports session time + AI token cost
to your DevMeter dashboard.

## Install

```bash
npm install -g devmeter-cli
```

Requires Node.js 22.6+ (24 recommended).

## Setup

```bash
devmeter login <api_key>
```

Get `<api_key>` from your [DevMeter dashboard](https://devmeter-pi.vercel.app)
→ Settings → Local collector.

Pass `--api-url <url>` (or set `DEVMETER_API_URL`) only if you're pointing at
your own DevMeter deployment or a local dev server; it defaults to
`https://devmeter-pi.vercel.app`.

## Usage

Run `claude` through the collector, from inside the project you're working on:

```bash
cd /path/to/your/project
devmeter claude
```

It launches `claude` (any arguments pass through, e.g.
`devmeter claude --resume <id>`) with a dedicated local OTLP receiver for
just that session, tagged to the current directory. When `claude` exits, the
session is sent to DevMeter automatically.

To stop typing `devmeter claude` every time, shadow `claude` in your shell
profile:

**PowerShell** (`$PROFILE`):

```powershell
function claude {
    devmeter claude @args
}
```

**bash/zsh** (`~/.bashrc` / `~/.zshrc`):

```bash
claude() { devmeter claude "$@"; }
```

### Alternative: `devmeter start`

A persistent collector left running in one terminal, with Claude Code pointed
at it manually elsewhere. Every session run while it's up is attributed to
wherever `devmeter start` itself was launched from.

```bash
cd /path/to/your/project
devmeter start
```

Run `devmeter status` to see in-progress sessions, `devmeter sync` to push
them immediately. Press **Ctrl+C** to stop `devmeter start` and flush.

## License

MIT
