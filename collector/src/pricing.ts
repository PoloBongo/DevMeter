import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
}

type PricingTable = Record<string, ModelPricing>;

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

export function estimateCostUsd(
  model: string,
  tokensInput: number,
  tokensOutput: number
): number {
  const pricing = loadPricing();
  const tier = pricing[tierForModel(model)] ?? pricing.default;
  const inputCost = (tokensInput / 1_000_000) * tier.inputPerMTok;
  const outputCost = (tokensOutput / 1_000_000) * tier.outputPerMTok;
  return inputCost + outputCost;
}
