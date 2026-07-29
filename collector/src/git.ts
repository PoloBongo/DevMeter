import { execSync } from "node:child_process";
import { basename } from "node:path";

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

export function extractTicketRef(branch: string | null): string | null {
  if (!branch) return null;
  const match = branch.match(/[A-Z][A-Z0-9]+-\d+/);
  return match ? match[0] : null;
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
