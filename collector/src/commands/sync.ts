import { requireConfig } from "../config.ts";
import { readAllStatusEntries } from "../status-store.ts";
import { sendSession } from "../api-client.ts";
import { extractTicketRef, getProjectName, guessClientName } from "../git.ts";

const STALE_AFTER_MS = 20 * 60 * 1000;

/**
 * Manual, on-demand push of whatever's currently in progress — reads the
 * same local status file `devmeter status` reads from, so it works from any
 * terminal without needing to reach into the running `devmeter claude`/
 * `devmeter start` process. The running process still syncs on its own
 * every 5 minutes; this is just for "I want it on the dashboard right now."
 */
export async function syncCommand(): Promise<void> {
  const config = requireConfig();
  const entries = readAllStatusEntries().filter(
    (entry) => Date.now() - new Date(entry.updatedAt).getTime() <= STALE_AFTER_MS
  );

  if (entries.length === 0) {
    console.log("No active session to sync. Run `devmeter claude` in a project.");
    return;
  }

  let failures = 0;
  for (const entry of entries) {
    try {
      await sendSession(config, {
        clientSessionId: entry.sessionId,
        projectName: getProjectName(entry.cwd),
        clientName: guessClientName(entry.cwd) ?? undefined,
        gitBranch: entry.gitBranch ?? undefined,
        ticketRef: extractTicketRef(entry.gitBranch) ?? undefined,
        startedAt: entry.startedAt,
        endedAt: new Date().toISOString(),
        tokensInput: entry.tokensInput,
        tokensOutput: entry.tokensOutput,
        tokensCacheRead: entry.tokensCacheRead,
        tokensCacheCreation: entry.tokensCacheCreation,
        estimatedCostUsd: entry.estimatedCostUsd,
        // Defensive fallback: a status.json entry written by a collector
        // process still running the pre-modelBreakdown code won't have it.
        modelBreakdown: entry.modelBreakdown ?? {},
      });
      console.log(`Synced ${entry.cwd}`);
    } catch (error) {
      failures++;
      console.error(`Failed to sync ${entry.cwd}:`, error);
    }
  }

  if (failures > 0) process.exitCode = 1;
}
