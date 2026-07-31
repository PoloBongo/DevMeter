export type Currency = "USD" | "EUR";

/**
 * Anthropic's API pricing is USD-denominated. Amounts the user types
 * themselves (hourly rate, subscription price) are already in their chosen
 * currency and never pass through this — only the USD cost estimate does.
 */
const FALLBACK_USD_TO_EUR = 0.92;
const RATE_TTL_MS = 6 * 60 * 60 * 1000;
const FX_URL = "https://api.frankfurter.app/latest?from=USD&to=EUR";

let cachedRate: { value: number; fetchedAt: number } | null = null;

/**
 * Live USD->EUR rate (ECB reference rate via Frankfurter, no API key), cached
 * in-memory for RATE_TTL_MS. Falls back to a fixed approximate rate on any
 * network/parse failure so a dead FX API never breaks the dashboard.
 */
export async function getUsdToEurRate(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.fetchedAt < RATE_TTL_MS) {
    return cachedRate.value;
  }
  try {
    const res = await fetch(FX_URL, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`FX fetch failed: ${res.status}`);
    const data = (await res.json()) as { rates?: { EUR?: number } };
    const rate = data.rates?.EUR;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      throw new Error("FX response missing a usable EUR rate");
    }
    cachedRate = { value: rate, fetchedAt: Date.now() };
    return rate;
  } catch {
    return FALLBACK_USD_TO_EUR;
  }
}

export function convertFromUsd(
  usd: number,
  currency: Currency,
  usdToEurRate: number
): number {
  return currency === "EUR" ? usd * usdToEurRate : usd;
}

export function currencySymbol(currency: Currency): string {
  return currency === "EUR" ? "€" : "$";
}

export function formatMoney(value: number, currency: Currency): string {
  return currency === "EUR"
    ? `${value.toFixed(2)}€`
    : `$${value.toFixed(2)}`;
}
