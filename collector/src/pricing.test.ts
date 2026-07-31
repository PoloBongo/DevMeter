import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateCostUsd, type TokenBreakdown } from "./pricing.ts";

const zero: TokenBreakdown = { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };

test("sonnet: input/output priced per the sonnet tier", () => {
  const cost = estimateCostUsd("claude-sonnet-4-5", {
    ...zero,
    input: 1_000_000,
    output: 1_000_000,
  });
  assert.equal(cost, 3 + 15);
});

test("sonnet: cache read is priced far below input (~10%)", () => {
  const cost = estimateCostUsd("claude-sonnet-4-5", {
    ...zero,
    cacheRead: 1_000_000,
  });
  assert.equal(cost, 0.3);
});

test("sonnet: cache creation is priced above input (~1.25x)", () => {
  const cost = estimateCostUsd("claude-sonnet-4-5", {
    ...zero,
    cacheCreation: 1_000_000,
  });
  assert.equal(cost, 3.75);
});

test("model tier is matched case-insensitively by substring", () => {
  const opus = estimateCostUsd("claude-Opus-4-1", { ...zero, input: 1_000_000 });
  const haiku = estimateCostUsd("claude-haiku-4-5", { ...zero, input: 1_000_000 });
  assert.equal(opus, 15);
  assert.equal(haiku, 0.8);
});

test("unrecognized model falls back to the default tier", () => {
  const known = estimateCostUsd("some-future-model", { ...zero, input: 1_000_000 });
  const fallback = estimateCostUsd("claude-sonnet-4-5", { ...zero, input: 1_000_000 });
  assert.equal(known, fallback);
});

test("all four token kinds are summed independently", () => {
  const cost = estimateCostUsd("claude-sonnet-4-5", {
    input: 2,
    output: 39,
    cacheRead: 0,
    cacheCreation: 42_735,
  });
  // Reproduces the "Yo" session from the dashboard: ~$0.16, all cache creation.
  assert.ok(Math.abs(cost - 0.1608) < 0.0001);
});

test("zero tokens cost zero", () => {
  assert.equal(estimateCostUsd("claude-sonnet-4-5", zero), 0);
});
