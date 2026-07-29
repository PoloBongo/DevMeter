import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";
import { formatDuration } from "@/lib/format";
import { formatMoney } from "@/lib/currency";
import { UsageChart } from "@/components/usage-chart";
import { AddProjectForm } from "@/components/add-project-form";
import { BreakEvenBanner } from "@/components/break-even-banner";
import { DashboardFilters } from "@/components/dashboard-filters";
import { ToastFromQuery } from "@/components/toast-from-query";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { project } = await searchParams;

  const data = await getDashboardData(userId, { projectId: project });
  const showPaygHint =
    data.pricingMode !== "PAYG" &&
    Math.round(data.totalMonthAiCostPaygEquivalent * 100) !==
      Math.round(data.totalMonthAiCost * 100);

  return (
    <div className="mx-auto w-full max-w-5xl px-7 py-8">
      <ToastFromQuery />
      <div className="mb-6.5 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <AddProjectForm />
      </div>

      {data.breakEven && (
        <div className="mb-5">
          <BreakEvenBanner breakEven={data.breakEven} currency={data.currency} />
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface px-5 py-4.5">
          <div className="mb-2 text-xs text-muted">
            Total time — this month
          </div>
          <div className="font-mono text-2xl font-semibold">
            {formatDuration(data.totalMonthMinutes)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface px-5 py-4.5">
          <div className="mb-2 text-xs text-muted">AI cost — this month</div>
          <div className="font-mono text-2xl font-semibold text-accent">
            {formatMoney(data.totalMonthAiCost, data.currency)}
          </div>
          {showPaygHint && (
            <div className="mt-1 text-[11px] text-dim">
              ≈ {formatMoney(data.totalMonthAiCostPaygEquivalent, data.currency)}{" "}
              pay-as-you-go
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface px-5 py-4.5">
          <div className="mb-2 text-xs text-muted">
            Total estimated cost
          </div>
          <div className="font-mono text-2xl font-semibold">
            {formatMoney(data.totalMonthCost, data.currency)}
          </div>
        </div>
      </div>

      <div className="mb-5">
        <UsageChart data={data.series} currency={data.currency} />
      </div>

      <div className="mb-3.5 flex items-center justify-between">
        <DashboardFilters projects={data.projectOptions} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-[2.2fr_1.3fr_1fr_1fr_1fr] px-5.5 py-3 text-[11.5px] uppercase tracking-wide text-muted border-b border-border">
          <span>Project</span>
          <span>Client</span>
          <span>Time (mo.)</span>
          <span>AI cost (mo.)</span>
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
            Math.round(project.monthAiCostPaygEquivalent * 100) !==
              Math.round(project.monthAiCost * 100);

          return (
            <Link
              key={project.id}
              href={`/dashboard/${project.id}`}
              className="grid grid-cols-[2.2fr_1.3fr_1fr_1fr_1fr] items-center px-5.5 py-3.5 border-b border-border/60 last:border-b-0 hover:bg-white/[0.02]"
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
                {formatDuration(project.monthMinutes)}
              </span>
              <div className="font-mono text-[13px] text-accent">
                {formatMoney(project.monthAiCost, data.currency)}
                {projectShowsPaygHint && (
                  <div className="text-[10.5px] text-dim">
                    ≈{" "}
                    {formatMoney(
                      project.monthAiCostPaygEquivalent,
                      data.currency
                    )}{" "}
                    payg
                  </div>
                )}
              </div>
              <span className="font-mono text-[13px] font-semibold">
                {formatMoney(project.monthTotalCost, data.currency)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
