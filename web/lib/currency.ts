export type Currency = "USD" | "EUR";

/**
 * Anthropic's API pricing is USD-denominated. There's no live FX lookup here —
 * just a fixed approximate rate to convert that USD estimate into the user's
 * display currency. Amounts the user types themselves (hourly rate,
 * subscription price) are already in their chosen currency and never pass
 * through this.
 */
const USD_TO_EUR = 0.92;

export function convertFromUsd(usd: number, currency: Currency): number {
  return currency === "EUR" ? usd * USD_TO_EUR : usd;
}

export function currencySymbol(currency: Currency): string {
  return currency === "EUR" ? "€" : "$";
}

export function formatMoney(value: number, currency: Currency): string {
  return currency === "EUR"
    ? `${value.toFixed(2)}€`
    : `$${value.toFixed(2)}`;
}
