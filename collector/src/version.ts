import { execSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_DIR = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * `devmeter start`/`devmeter claude` are long-running processes that keep
 * whatever code was on disk when they started — a `git pull` into this
 * (usually npm-linked) package doesn't affect an already-running process.
 * Printing the commit at startup gives a quick way to spot a stale process:
 * compare it against `git log -1` in the repo.
 */
export function describeCodeVersion(): string {
  try {
    const hash = execSync("git rev-parse --short HEAD", {
      cwd: PACKAGE_DIR,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    return `commit ${hash}`;
  } catch {
    return "unknown commit (not a git checkout)";
  }
}
