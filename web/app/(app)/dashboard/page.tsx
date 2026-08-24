import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDashboardData, type DashboardPeriod } from "@/lib/queries";
import { formatDuration, formatDateLocal } from "@/lib/format";
import { formatMoney } from "@/lib/currency";
import { UsageChart } from "@/components/usage-chart";
import { AddProjectForm } from "@/components/add-project-form";
import { BreakEvenBanner } from "@/components/break-even-banner";
import { BudgetBanner } from "@/components/budget-banner";
import { DashboardFilters } from "@/components/dashboard-filters";
import { ToastFromQuery } from "@/components/toast-from-query";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    project?: string;
    client?: string;
    source?: string;
    period?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { project, client, source, period, from, to } = await searchParams;

  const normalizedPeriod: DashboardPeriod =
    period === "7" || period === "30" || period === "all" || period === "custom"
      ? period
      : "month";

  // A valid YYYY-MM-DD from the date inputs; anything else (missing, malformed,
  // partially typed) is ignored rather than passed to the query as a bad Date.
  const parseDateParam = (value: string | undefined): Date | null => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const today = new Date();
  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const customFrom = parseDateParam(from) ?? defaultFrom;
  const customTo = parseDateParam(to) ?? today;

  const data = await getDashboardData(userId, {
    projectId: project,
    client,
    source,
    period: normalizedPeriod,
    customFrom,
    customTo,
  });
  const showPaygHint =
    data.pricingMode !== "PAYG" &&
    Math.round(data.totalPeriodAiCostPaygEquivalent * 100) !==
      Math.round(data.totalPeriodAiCost * 100);

  const periodLabel =
    normalizedPeriod === "7"
      ? "last 7 days"
      : normalizedPeriod === "30"
        ? "last 30 days"
        : normalizedPeriod === "all"
          ? "all time"
          : normalizedPeriod === "custom"
            ? `${formatDateLocal(customFrom)} → ${formatDateLocal(customTo)}`
            : "this month";
  const periodLabelShort =
    normalizedPeriod === "7"
      ? "7d"
      : normalizedPeriod === "30"
        ? "30d"
        : normalizedPeriod === "all"
          ? "all time"
          : normalizedPeriod === "custom"
            ? "custom"
            : "mo.";

  return (
    <div className="mx-auto w-full max-w-5xl px-7 py-8">
      <ToastFromQuery />
      <div className="mb-6.5 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <AddProjectForm />
      </div>

      {data.budget && (
        <div className="mb-5">
          <BudgetBanner budget={data.budget} currency={data.currency} />
        </div>
      )}

      {data.breakEven && (
        <div className="mb-5">
          <BreakEvenBanner breakEven={data.breakEven} currency={data.currency} />
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface px-5 py-4.5">
          <div className="mb-2 text-xs text-muted">
            Total time — {periodLabel}
          </div>
          <div className="font-mono text-2xl font-semibold">
            {formatDuration(data.totalPeriodMinutes)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface px-5 py-4.5">
          <div className="mb-2 text-xs text-muted">AI cost — {periodLabel}</div>
          <div className="font-mono text-2xl font-semibold text-accent">
            {formatMoney(data.totalPeriodAiCost, data.currency)}
          </div>
          {showPaygHint && (
            <div className="mt-1 text-[11px] text-dim">
              ≈ {formatMoney(data.totalPeriodAiCostPaygEquivalent, data.currency)}{" "}
              pay-as-you-go
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface px-5 py-4.5">
          <div className="mb-2 text-xs text-muted">
            Total estimated cost — {periodLabel}
          </div>
          <div className="font-mono text-2xl font-semibold">
            {formatMoney(data.totalPeriodCost, data.currency)}
          </div>
        </div>
      </div>

      <div className="mb-5">
        <UsageChart data={data.series} currency={data.currency} />
      </div>

      <div className="mb-3.5 flex items-center justify-between">
        <DashboardFilters
          projects={data.projectOptions}
          clients={data.clientOptions}
          sources={data.sourceOptions}
          defaultFrom={formatDateLocal(customFrom)}
          defaultTo={formatDateLocal(customTo)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-[2.2fr_1.3fr_1fr_1fr_1fr] px-5.5 py-3 text-[11.5px] uppercase tracking-wide text-muted border-b border-border">
          <span>Project</span>
          <span>Client</span>
          <span>Time ({periodLabelShort})</span>
          <span>AI cost ({periodLabelShort})</span>
          <span>Total cost</span>
        </div>

        {data.projectSummaries.length === 0 && (
          <div className="px-5.5 py-10 text-center text-sm text-muted">
            No projects yet. Add one to start tracking sessions.
          </div>
        )}

        {data.projectSummaries.map((project) => {
          const projectShowsPaygHint =
            data.pricingMode !== "PAYG" &&
            Math.round(project.periodAiCostPaygEquivalent * 100) !==
              Math.round(project.periodAiCost * 100);

          return (
            <Link
              key={project.id}
              href={`/dashboard/${project.id}`}
              className="grid grid-cols-[2.2fr_1.3fr_1fr_1fr_1fr] items-center px-5.5 py-3.5 border-b border-border/60 last:border-b-0 hover:bg-overlay-hover"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[13.5px] font-medium">
                  {project.name}
                </span>
                <span className="text-[11.5px] text-dim">
                  {project.lastActivity
                    ? project.lastActivity.toLocaleDateString()
                    : "No sessions yet"}
                </span>
              </div>
              <span className="text-[13px] text-muted">
                {project.clientName ?? "—"}
              </span>
              <span className="font-mono text-[13px]">
                {formatDuration(project.periodMinutes)}
              </span>
              <div className="font-mono text-[13px] text-accent">
                {formatMoney(project.periodAiCost, data.currency)}
                {projectShowsPaygHint && (
                  <div className="text-[10.5px] text-dim">
                    ≈{" "}
                    {formatMoney(
                      project.periodAiCostPaygEquivalent,
                      data.currency
                    )}{" "}
                    payg
                  </div>
                )}
              </div>
              <span className="font-mono text-[13px] font-semibold">
                {formatMoney(project.periodTotalCost, data.currency)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
