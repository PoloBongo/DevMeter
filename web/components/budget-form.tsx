"use client";

import { useState } from "react";
import { updateBudgetAction } from "@/app/(app)/settings/actions";
import { currencySymbol, type Currency } from "@/lib/currency";
import { useToast } from "@/components/toast-provider";

export function BudgetForm({
  budgetAmount,
  currency,
}: {
  budgetAmount: number | null;
  currency: Currency;
}) {
  const [enabled, setEnabled] = useState(budgetAmount !== null);
  const toast = useToast();

  return (
    <form
      action={async (formData) => {
        await updateBudgetAction(formData);
        toast(enabled ? "Budget alert saved" : "Budget alert disabled");
      }}
      className="flex flex-col gap-3"
    >
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          name="budgetEnabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="cursor-pointer"
        />
        <span className="text-[13.5px]">Alert me when I&apos;m close to a monthly AI budget</span>
      </label>

      {enabled && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">
            Monthly AI cost budget — a banner appears on the dashboard once
            you cross 80% of it.
          </span>
          <div className="flex items-center overflow-hidden rounded-lg border border-border bg-background w-fit">
            <span className="pl-3 pr-1 font-mono text-[13px] text-muted">
              {currencySymbol(currency)}
            </span>
            <input
              type="number"
              name="budgetAmount"
              defaultValue={budgetAmount ?? 100}
              min={0}
              max={1000000}
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
