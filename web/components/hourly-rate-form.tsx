"use client";

import { useState } from "react";
import { updateHourlyRateAction } from "@/app/(app)/settings/actions";
import { currencySymbol, type Currency } from "@/lib/currency";
import { useToast } from "@/components/toast-provider";

export function HourlyRateForm({
  rateMode,
  hourlyRate,
  dailyRate,
  hoursPerDay,
  currency,
}: {
  rateMode: string;
  hourlyRate: number;
  dailyRate: number | null;
  hoursPerDay: number;
  currency: Currency;
}) {
  const [mode, setMode] = useState(rateMode);
  const symbol = currencySymbol(currency);
  const toast = useToast();

  return (
    <form
      action={async (formData) => {
        await updateHourlyRateAction(formData);
        toast("Rate updated");
      }}
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="rateMode" value={mode} />

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setMode("HOURLY")}
          className={`cursor-pointer rounded-lg px-3 py-1.5 text-[12.5px] font-medium ${
            mode === "HOURLY"
              ? "bg-accent text-background"
              : "border border-border text-muted"
          }`}
        >
          Per hour
        </button>
        <button
          type="button"
          onClick={() => setMode("DAILY")}
          className={`cursor-pointer rounded-lg px-3 py-1.5 text-[12.5px] font-medium ${
            mode === "DAILY"
              ? "bg-accent text-background"
              : "border border-border text-muted"
          }`}
        >
          Per day (TJM)
        </button>
      </div>

      {mode === "HOURLY" ? (
        <div className="flex items-center gap-2.5">
          <div className="flex items-center overflow-hidden rounded-lg border border-border bg-background">
            <span className="pl-3 pr-1 font-mono text-[13px] text-muted">
              {symbol}
            </span>
            <input
              type="number"
              name="hourlyRate"
              defaultValue={hourlyRate}
              min={0}
              max={1000}
              step={1}
              className="w-24 bg-transparent py-2.5 pr-2 font-mono text-[13px] text-foreground outline-none"
            />
            <span className="pr-3 text-[12.5px] text-dim">/ hour</span>
          </div>
          <button
            type="submit"
            className="cursor-pointer rounded-lg bg-accent px-3.5 py-2.5 text-[13px] font-semibold text-background"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center overflow-hidden rounded-lg border border-border bg-background">
            <span className="pl-3 pr-1 font-mono text-[13px] text-muted">
              {symbol}
            </span>
            <input
              type="number"
              name="dailyRate"
              defaultValue={dailyRate ?? hourlyRate * hoursPerDay}
              min={0}
              max={8000}
              step={10}
              className="w-24 bg-transparent py-2.5 pr-2 font-mono text-[13px] text-foreground outline-none"
            />
            <span className="pr-3 text-[12.5px] text-dim">/ day</span>
          </div>
          <div className="flex items-center overflow-hidden rounded-lg border border-border bg-background">
            <input
              type="number"
              name="hoursPerDay"
              defaultValue={hoursPerDay}
              min={1}
              max={24}
              step={0.5}
              className="w-16 bg-transparent py-2.5 pl-3 pr-1 font-mono text-[13px] text-foreground outline-none"
            />
            <span className="pr-3 text-[12.5px] text-dim">h / day</span>
          </div>
          <button
            type="submit"
            className="cursor-pointer rounded-lg bg-accent px-3.5 py-2.5 text-[13px] font-semibold text-background"
          >
            Save
          </button>
        </div>
      )}
    </form>
  );
}
