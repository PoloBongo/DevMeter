import type { Budget } from "@/lib/queries";
import { formatMoney, type Currency } from "@/lib/currency";

const WARNING_THRESHOLD = 80;

export function BudgetBanner({
  budget,
  currency,
}: {
  budget: Budget;
  currency: Currency;
}) {
  const percent = Math.round(budget.percentUsed);
  const overBudget = percent >= 100;
  const nearBudget = percent >= WARNING_THRESHOLD;

  const tone = overBudget
    ? "border-red-500/30 bg-error-bg text-error-text"
    : nearBudget
      ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
      : "border-border bg-surface text-muted";

  const barColor = overBudget ? "bg-red-500" : nearBudget ? "bg-amber-500" : "bg-accent";

  return (
    <div className={`rounded-xl border px-4.5 py-3.5 text-[13px] ${tone}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span>
          {overBudget ? "Over budget" : nearBudget ? "Approaching budget" : "Monthly AI budget"}
          {" — "}
          {formatMoney(budget.spent, currency)} of{" "}
          {formatMoney(budget.amount, currency)} ({percent}%)
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/50">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}
