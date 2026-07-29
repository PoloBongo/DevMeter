import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiKeySection } from "@/components/api-key-section";
import { PricingModeForm } from "@/components/pricing-mode-form";
import { updateHourlyRateAction } from "@/app/(app)/settings/actions";

export default async function SettingsPage() {
  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
  });

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
        <div className="mb-1 text-[14.5px] font-semibold">Hourly rate</div>
        <p className="mb-4 text-[13px] leading-relaxed text-muted">
          Used to estimate total cost per project — your time × rate, plus AI
          spend.
        </p>
        <form
          action={updateHourlyRateAction}
          className="flex items-center gap-2.5"
        >
          <div className="flex items-center overflow-hidden rounded-lg border border-border bg-background">
            <span className="pl-3 pr-1 font-mono text-[13px] text-muted">
              $
            </span>
            <input
              type="number"
              name="hourlyRate"
              defaultValue={Number(user.hourlyRate)}
              min={0}
              max={1000}
              step={1}
              className="w-24 bg-transparent py-2.5 pr-2 font-mono text-[13px] text-foreground outline-none"
            />
            <span className="pr-3 text-[12.5px] text-dim">/ hour</span>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-accent px-3.5 py-2.5 text-[13px] font-semibold text-background"
          >
            Save
          </button>
        </form>
      </div>

      <div className="mb-4.5 rounded-xl border border-border bg-surface p-5.5">
        <div className="mb-1 text-[14.5px] font-semibold">AI pricing</div>
        <p className="mb-4 text-[13px] leading-relaxed text-muted">
          How AI cost is estimated — matters if you pay per token vs. a flat
          Claude subscription.
        </p>
        <PricingModeForm
          pricingMode={user.pricingMode}
          subscriptionCostUsd={
            user.subscriptionCostUsd ? Number(user.subscriptionCostUsd) : null
          }
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
