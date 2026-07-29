import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";
import { formatDuration, formatUsd } from "@/lib/format";
import { UsageChart } from "@/components/usage-chart";
import { AddProjectForm } from "@/components/add-project-form";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const data = await getDashboardData(userId);

  return (
    <div className="mx-auto w-full max-w-5xl px-7 py-8">
      <div className="mb-6.5 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <AddProjectForm />
      </div>

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
            {formatUsd(data.totalMonthAiCostUsd)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface px-5 py-4.5">
          <div className="mb-2 text-xs text-muted">
            Total estimated cost
          </div>
          <div className="font-mono text-2xl font-semibold">
            {formatUsd(data.totalMonthCostUsd)}
          </div>
        </div>
      </div>

      <div className="mb-5">
        <UsageChart data={data.series} />
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

        {data.projectSummaries.map((project) => (
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
            <span className="font-mono text-[13px] text-accent">
              {formatUsd(project.monthAiCostUsd)}
            </span>
            <span className="font-mono text-[13px] font-semibold">
              {formatUsd(project.monthTotalCostUsd)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
