import { auth, requireUser } from "@/lib/auth";
import { ApiKeySection } from "@/components/api-key-section";
import { HourlyRateForm } from "@/components/hourly-rate-form";
import { PricingModeForm } from "@/components/pricing-mode-form";
import { CurrencyForm } from "@/components/currency-form";
import { BudgetForm } from "@/components/budget-form";

export default async function SettingsPage() {
  const session = await auth();
  const user = await requireUser(session!.user.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-7 py-8">
      <h1 className="mb-6.5 text-xl font-semibold tracking-tight">
        Settings
      </h1>

      <div className="mb-4.5">
        <ApiKeySection
          hasKey={Boolean(user.apiKeyHash)}
          maskedPrefix={user.apiKeyPrefix}
        />
      </div>

      <div className="mb-4.5 rounded-xl border border-border bg-surface p-5.5">
        <div className="mb-1 text-[14.5px] font-semibold">Currency</div>
        <p className="mb-4 text-[13px] leading-relaxed text-muted">
          Display currency for all costs. Amounts you type yourself (rate,
          subscription price) keep whatever number you enter — they aren&apos;t
          converted when you switch.
        </p>
        <CurrencyForm currency={user.currency} />
      </div>

      <div className="mb-4.5 rounded-xl border border-border bg-surface p-5.5">
        <div className="mb-1 text-[14.5px] font-semibold">Rate</div>
        <p className="mb-4 text-[13px] leading-relaxed text-muted">
          Used to estimate total cost per project — your time × rate, plus AI
          spend. Set it per hour, or per day (TJM) if that&apos;s how you bill.
        </p>
        <HourlyRateForm
          rateMode={user.rateMode}
          hourlyRate={Number(user.hourlyRate)}
          dailyRate={user.dailyRate ? Number(user.dailyRate) : null}
          hoursPerDay={Number(user.hoursPerDay)}
          currency={user.currency}
        />
      </div>

      <div className="mb-4.5 rounded-xl border border-border bg-surface p-5.5">
        <div className="mb-1 text-[14.5px] font-semibold">AI pricing</div>
        <p className="mb-4 text-[13px] leading-relaxed text-muted">
          How AI cost is estimated — matters if you pay per token vs. a flat
          Claude subscription.
        </p>
        <PricingModeForm
          pricingMode={user.pricingMode}
          subscriptionCost={
            user.subscriptionCost ? Number(user.subscriptionCost) : null
          }
          currency={user.currency}
        />
      </div>

      <div className="mb-4.5 rounded-xl border border-border bg-surface p-5.5">
        <div className="mb-1 text-[14.5px] font-semibold">Budget</div>
        <p className="mb-4 text-[13px] leading-relaxed text-muted">
          Optional monthly spending guardrail — account-wide, across all
          projects.
        </p>
        <BudgetForm
          // Remounts on every successful save, so the checkbox/amount field
          // always reflect the just-persisted value instead of whatever
          // local state survived the form's native reset-on-success.
          key={String(user.budgetAmount ?? "off")}
          budgetAmount={user.budgetAmount ? Number(user.budgetAmount) : null}
          currency={user.currency}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5.5">
        <div className="mb-3.5 text-[14.5px] font-semibold">Account</div>
        <div className="flex items-center justify-between py-2.5 text-[13px]">
          <span className="text-muted">Email</span>
          <span>{user.email}</span>
        </div>
      </div>
    </div>
  );
}
