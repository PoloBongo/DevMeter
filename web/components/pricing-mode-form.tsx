"use client";

import { useState } from "react";
import { updatePricingModeAction } from "@/app/(app)/settings/actions";
import { currencySymbol, type Currency } from "@/lib/currency";

const OPTIONS = [
  {
    value: "PAYG",
    label: "Pay-as-you-go",
    description: "AI cost = tokens used × API pricing.",
  },
  {
    value: "SUBSCRIPTION_FLAT",
    label: "Subscription (flat)",
    description:
      "Already paying a flat plan — AI cost is zero, total cost is just your time.",
  },
  {
    value: "SUBSCRIPTION_AMORTIZED",
    label: "Subscription (amortized)",
    description:
      "Spread your plan's monthly price across sessions by their share of that month's tokens.",
  },
] as const;

export function PricingModeForm({
  pricingMode,
  subscriptionCost,
  currency,
}: {
  pricingMode: string;
  subscriptionCost: number | null;
  currency: Currency;
}) {
  const [mode, setMode] = useState(pricingMode);

  return (
    <form action={updatePricingModeAction} className="flex flex-col gap-3">
      {OPTIONS.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-start gap-2.5"
        >
          <input
            type="radio"
            name="pricingMode"
            value={option.value}
            checked={mode === option.value}
            onChange={() => setMode(option.value)}
            className="mt-1 cursor-pointer"
          />
          <span>
            <span className="block text-[13.5px] font-medium">
              {option.label}
            </span>
            <span className="block text-[12.5px] text-muted">
              {option.description}
            </span>
          </span>
        </label>
      ))}

      {mode !== "PAYG" && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">
            Subscription price / month — used for the break-even indicator
            {mode === "SUBSCRIPTION_AMORTIZED" ? " and to amortize AI cost" : ""}.
          </span>
          <div className="flex items-center overflow-hidden rounded-lg border border-border bg-background w-fit">
            <span className="pl-3 pr-1 font-mono text-[13px] text-muted">
              {currencySymbol(currency)}
            </span>
            <input
              type="number"
              name="subscriptionCost"
              defaultValue={subscriptionCost ?? 20}
              min={0}
              max={10000}
              step={1}
              className="w-24 bg-transparent py-2.5 pr-2 font-mono text-[13px] text-foreground outline-none"
            />
            <span className="pr-3 text-[12.5px] text-dim">/ month</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="cursor-pointer self-start rounded-lg bg-accent px-3.5 py-2.5 text-[13px] font-semibold text-background"
      >
        Save
      </button>
    </form>
  );
}
