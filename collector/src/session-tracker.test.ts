import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("finalize() rotates the session id so the next session doesn't upsert onto the same row", async () => {
  // status-store.ts resolves its path from homedir() at import time, so
  // point it at a throwaway dir before pulling in session-tracker.ts.
  const fakeHome = mkdtempSync(join(tmpdir(), "devmeter-test-"));
  process.env.USERPROFILE = fakeHome;
  process.env.HOME = fakeHome;

  const postedIds: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_url, init) => {
    const body = JSON.parse((init as RequestInit).body as string) as {
      clientSessionId: string;
    };
    postedIds.push(body.clientSessionId);
    return new Response(JSON.stringify({}), { status: 201 });
  }) as typeof fetch;

  try {
    const { SessionTracker } = await import("./session-tracker.ts");
    const tracker = new SessionTracker(
      { apiKey: "test-key", apiUrl: "http://example.invalid" },
      fakeHome
    );

    tracker.addTokens("claude-sonnet-4-5", "input", 100);
    await tracker.finalize();

    tracker.addTokens("claude-sonnet-4-5", "input", 50);
    await tracker.finalize();

    assert.equal(postedIds.length, 2, "expected one sync per finalized session");
    assert.notEqual(
      postedIds[0],
      postedIds[1],
      "the second session reused the first session's clientSessionId — it would upsert onto the same DB row"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("sync() reports a per-model token/cost breakdown alongside the aggregate totals", async () => {
  const fakeHome = mkdtempSync(join(tmpdir(), "devmeter-test-"));
  process.env.USERPROFILE = fakeHome;
  process.env.HOME = fakeHome;

  let postedBody: Record<string, unknown> | null = null;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_url, init) => {
    postedBody = JSON.parse((init as RequestInit).body as string);
    return new Response(JSON.stringify({}), { status: 201 });
  }) as typeof fetch;

  try {
    const { SessionTracker } = await import("./session-tracker.ts");
    const tracker = new SessionTracker(
      { apiKey: "test-key", apiUrl: "http://example.invalid" },
      fakeHome
    );

    tracker.addTokens("claude-sonnet-4-5", "input", 1_000_000);
    tracker.addTokens("claude-opus-4-1", "input", 1_000_000);
    await tracker.finalize();

    const body = postedBody as unknown as {
      tokensInput: number;
      modelBreakdown: Record<string, { input: number; costUsd: number }>;
    };

    assert.equal(body.tokensInput, 2_000_000, "aggregate totals still sum across models");
    assert.equal(Object.keys(body.modelBreakdown).length, 2);
    assert.equal(body.modelBreakdown["claude-sonnet-4-5"].input, 1_000_000);
    assert.equal(body.modelBreakdown["claude-opus-4-1"].input, 1_000_000);
    // Opus input is 5x Sonnet's per pricing.json — breakdown must reflect
    // the per-model rate, not an even split of the aggregate cost.
    assert.ok(
      body.modelBreakdown["claude-opus-4-1"].costUsd >
        body.modelBreakdown["claude-sonnet-4-5"].costUsd * 4
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
