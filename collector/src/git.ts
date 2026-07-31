import { execSync } from "node:child_process";
import { basename, dirname } from "node:path";

export function getCurrentBranch(cwd: string): string | null {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return branch || null;
  } catch {
    return null;
  }
}

/**
 * Two conventions in the wild: classic tracker IDs like `JIRA-123`, and this
 * repo's own `feature/192-nom`, `add/192-nom`, `update/192-nom`,
 * `delete/192-nom` (a type prefix, then a bare ticket number before the
 * slug). Tried in that order; the numbered form is rendered as `#192`.
 */
export function extractTicketRef(branch: string | null): string | null {
  if (!branch) return null;
  const jiraStyle = branch.match(/[A-Z][A-Z0-9]+-\d+/);
  if (jiraStyle) return jiraStyle[0];
  const numbered = branch.match(/^(?:feature|add|update|delete)\/(\d+)-/i);
  return numbered ? `#${numbered[1]}` : null;
}

export function getProjectName(cwd: string): string {
  try {
    const remote = execSync("git remote get-url origin", {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    const name = remote.split(/[/\\]/).pop()?.replace(/\.git$/, "");
    if (name) return name;
  } catch {
    // no remote configured, fall back to directory name
  }
  return basename(cwd);
}

/**
 * Best-effort client guess from folder layout (e.g. Web/<client>/<project>) —
 * just the parent directory name. Only used when a project is first created;
 * users can rename it afterward from the dashboard.
 */
export function guessClientName(cwd: string): string | null {
  const parent = dirname(cwd);
  const name = basename(parent);
  return name && name !== parent ? name : null;
}
