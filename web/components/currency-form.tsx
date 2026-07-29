"use client";

import { useState } from "react";
import { updateCurrencyAction } from "@/app/(app)/settings/actions";
import type { Currency } from "@/lib/currency";

const OPTIONS: { value: Currency; label: string }[] = [
  { value: "EUR", label: "€ Euro" },
  { value: "USD", label: "$ US Dollar" },
];

export function CurrencyForm({ currency }: { currency: Currency }) {
  const [value, setValue] = useState<Currency>(currency);

  return (
    <form action={updateCurrencyAction} className="flex items-center gap-2.5">
      <div className="flex gap-1.5">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setValue(option.value)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-[12.5px] font-medium ${
              value === option.value
                ? "bg-accent text-background"
                : "border border-border text-muted"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="currency" value={value} />
      <button
        type="submit"
        className="cursor-pointer rounded-lg border border-border px-3.5 py-1.5 text-[12.5px] text-foreground"
      >
        Save
      </button>
    </form>
  );
}
