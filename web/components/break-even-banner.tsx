import type { BreakEven } from "@/lib/queries";
import { formatMoney, type Currency } from "@/lib/currency";

export function BreakEvenBanner({
  breakEven,
  currency,
}: {
  breakEven: BreakEven;
  currency: Currency;
}) {
  if (breakEven.reached) {
    return (
      <div className="rounded-xl border border-accent/25 bg-accent/10 px-4.5 py-3.5 text-[13px] text-accent">
        Subscription rentabilisée — tu as consommé l&apos;équivalent de{" "}
        {formatMoney(breakEven.paygEquivalent, currency)} ce mois-ci pour un
        abonnement à {formatMoney(breakEven.subscriptionCost, currency)}.
        Économie : {formatMoney(-breakEven.delta, currency)}.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface px-4.5 py-3.5 text-[13px] text-muted">
      Encore {formatMoney(breakEven.delta, currency)} de conso équivalente
      avant de rentabiliser ton abonnement à{" "}
      {formatMoney(breakEven.subscriptionCost, currency)} (
      {formatMoney(breakEven.paygEquivalent, currency)} consommés ce mois-ci).
    </div>
  );
}
