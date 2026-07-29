Paste everything below this line as your first message to Claude Code on
the new machine (in an empty folder, or anywhere — it will clone the repo
itself).

---

Set up the DevMeter collector on this machine so I can track Claude Code
sessions (time + AI token cost per project) against my existing DevMeter
account at https://devmeter-pi.vercel.app. Do this:

1. Check `node --version` — needs 22.6+ (24 recommended). If it's missing
   or too old, stop and tell me to install it first.
2. Check `claude --version` (the Claude Code CLI) is installed and on
   PATH. If not, stop and tell me to install it first.
3. Clone https://github.com/PoloBongo/DevMeter.git into the current
   directory if it isn't already here.
4. In `collector/`, run `npm install` then `npm link` to expose the
   global `devmeter` command.
5. Ask me for my DevMeter API key (from https://devmeter-pi.vercel.app →
   Settings → Local collector — I'll generate one there if I don't have
   it), then run:
   `devmeter login <key> --api-url https://devmeter-pi.vercel.app`
6. Set up a shell alias so plain `claude` transparently routes through
   `devmeter claude` (which tags each session with its real directory so
   tokens land on the right project):
   - **PowerShell**: create `$PROFILE` if it doesn't exist
     (`New-Item -ItemType File -Path $PROFILE -Force`), then append:
     ```powershell
     function claude {
         devmeter claude @args
     }
     ```
   - **bash/zsh**: append to `~/.bashrc` or `~/.zshrc`:
     ```bash
     claude() { devmeter claude "$@"; }
     ```
7. Tell me to open a new terminal for the alias to take effect, and that
   after that I can just use `claude` normally — no `devmeter start`
   needed, every session tracks itself.

Don't touch `web/` or the Neon database — this is collector-only setup on
a machine that just needs to report to the already-deployed app.
