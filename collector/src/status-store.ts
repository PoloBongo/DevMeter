import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { STATUS_PATH, CONFIG_DIR } from "./config.ts";

export interface StatusEntry {
  sessionId: string;
  cwd: string;
  gitBranch: string | null;
  startedAt: string;
  updatedAt: string;
  tokensInput: number;
  tokensOutput: number;
  tokensCacheRead: number;
  tokensCacheCreation: number;
  estimatedCostUsd: number;
}

type StatusMap = Record<string, StatusEntry>;

function readAll(): StatusMap {
  if (!existsSync(STATUS_PATH)) return {};
  try {
    return JSON.parse(readFileSync(STATUS_PATH, "utf-8")) as StatusMap;
  } catch {
    return {};
  }
}

function writeAll(map: StatusMap): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(STATUS_PATH, JSON.stringify(map, null, 2), "utf-8");
}

export function writeStatusEntry(cwd: string, entry: StatusEntry): void {
  const map = readAll();
  map[cwd] = entry;
  writeAll(map);
}

export function removeStatusEntry(cwd: string): void {
  const map = readAll();
  delete map[cwd];
  writeAll(map);
}

export function readAllStatusEntries(): StatusEntry[] {
  return Object.values(readAll());
}
