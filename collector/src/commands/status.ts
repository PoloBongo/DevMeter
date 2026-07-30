import { readAllStatusEntries } from "../status-store.ts";

const STALE_AFTER_MS = 20 * 60 * 1000;

export function statusCommand(): void {
  const entries = readAllStatusEntries().filter(
    (entry) => Date.now() - new Date(entry.updatedAt).getTime() <= STALE_AFTER_MS
  );

  if (entries.length === 0) {
    console.log("No active session. Run `devmeter start` in a project.");
    return;
  }

  for (const status of entries) {
    const startedAt = new Date(status.startedAt);
    const minutes = Math.round((Date.now() - startedAt.getTime()) / 60_000);

    console.log(`Project:  ${status.cwd}`);
    console.log(`Branch:   ${status.gitBranch ?? "unknown"}`);
    console.log(`Running:  ${minutes} min`);
    console.log(
      `Tokens:   ${status.tokensInput} in / ${status.tokensOutput} out / ` +
        `${status.tokensCacheRead} cache read / ${status.tokensCacheCreation} cache write`
    );
    console.log(`Est. cost: $${status.estimatedCostUsd.toFixed(4)}`);
    console.log("");
  }
}
