import { existsSync, readFileSync } from "node:fs";
import { STATUS_PATH } from "../config.ts";

const STALE_AFTER_MS = 20 * 60 * 1000;

interface StatusFile {
  cwd: string;
  gitBranch: string | null;
  startedAt: string;
  updatedAt: string;
  tokensInput: number;
  tokensOutput: number;
  estimatedCostUsd: number;
}

export function statusCommand(): void {
  if (!existsSync(STATUS_PATH)) {
    console.log("No active session. Run `devmeter start` in a project.");
    return;
  }

  const status = JSON.parse(readFileSync(STATUS_PATH, "utf-8")) as StatusFile;
  const updatedAt = new Date(status.updatedAt);
  const isStale = Date.now() - updatedAt.getTime() > STALE_AFTER_MS;

  if (isStale) {
    console.log("No active session. Run `devmeter start` in a project.");
    return;
  }

  const startedAt = new Date(status.startedAt);
  const minutes = Math.round((Date.now() - startedAt.getTime()) / 60_000);

  console.log(`Project:  ${status.cwd}`);
  console.log(`Branch:   ${status.gitBranch ?? "unknown"}`);
  console.log(`Running:  ${minutes} min`);
  console.log(`Tokens:   ${status.tokensInput} in / ${status.tokensOutput} out`);
  console.log(`Est. cost: $${status.estimatedCostUsd.toFixed(4)}`);
}
