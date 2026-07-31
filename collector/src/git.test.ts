import { test } from "node:test";
import assert from "node:assert/strict";
import { extractTicketRef } from "./git.ts";

test("matches feature/add/update/delete + number branches", () => {
  assert.equal(extractTicketRef("feature/192-nom-du-truc"), "#192");
  assert.equal(extractTicketRef("add/192-nom"), "#192");
  assert.equal(extractTicketRef("update/192-nom"), "#192");
  assert.equal(extractTicketRef("delete/192-nom"), "#192");
});

test("prefix match is case-insensitive", () => {
  assert.equal(extractTicketRef("Feature/192-nom"), "#192");
  assert.equal(extractTicketRef("ADD/192-nom"), "#192");
});

test("still matches classic tracker-style refs (e.g. JIRA-123)", () => {
  assert.equal(extractTicketRef("fix/DEVM-142-cache-split"), "DEVM-142");
});

test("jira-style match takes priority when both could apply", () => {
  assert.equal(extractTicketRef("feature/DEVM-142-192-nom"), "DEVM-142");
});

test("no ticket-shaped segment returns null", () => {
  assert.equal(extractTicketRef("main"), null);
  assert.equal(extractTicketRef("chore/cleanup"), null);
  assert.equal(extractTicketRef(null), null);
});
