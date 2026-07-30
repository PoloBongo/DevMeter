import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
  cacheReadPerMTok: number;
  cacheCreationPerMTok: number;
}

type PricingTable = Record<string, ModelPricing>;

export interface TokenBreakdown {
  input: number;
  output: number;
  cacheRead: number;
  cacheCreation: number;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRICING_PATH = join(__dirname, "..", "pricing.json");

let cachedPricing: PricingTable | null = null;

function loadPricing(): PricingTable {
  if (!cachedPricing) {
    cachedPricing = JSON.parse(
      readFileSync(PRICING_PATH, "utf-8")
    ) as PricingTable;
  }
  return cachedPricing;
}

function tierForModel(model: string): string {
  const lower = model.toLowerCase();
  if (lower.includes("opus")) return "opus";
  if (lower.includes("haiku")) return "haiku";
  if (lower.includes("sonnet")) return "sonnet";
  return "default";
}

export function estimateCostUsd(model: string, tokens: TokenBreakdown): number {
  const pricing = loadPricing();
  const tier = pricing[tierForModel(model)] ?? pricing.default;
  return (
    (tokens.input / 1_000_000) * tier.inputPerMTok +
    (tokens.output / 1_000_000) * tier.outputPerMTok +
    (tokens.cacheRead / 1_000_000) * tier.cacheReadPerMTok +
    (tokens.cacheCreation / 1_000_000) * tier.cacheCreationPerMTok
  );
}
