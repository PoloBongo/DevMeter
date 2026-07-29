import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { filterSessions, getProjectDetail, sessionMinutes } from "@/lib/queries";
import { formatDuration, formatTokens } from "@/lib/format";
import { formatMoney } from "@/lib/currency";
import { ProjectFilters } from "@/components/project-filters";
import { ProjectClientForm } from "@/components/project-client-form";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { DeleteSessionButton } from "@/components/delete-session-button";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ range?: string; q?: string }>;
}) {
  const session = await auth();
  const { projectId } = await params;
  const { range, q } = await searchParams;

  const detail = await getProjectDetail(session!.user.id, projectId);
  if (!detail) notFound();

  const normalizedRange = range === "7" || range === "all" ? range : "30";
  const filtered = filterSessions(detail.project.sessions, {
    range: normalizedRange,
    q,
  });

  const exportParams = new URLSearchParams();
  exportParams.set("range", normalizedRange);
  if (q) exportParams.set("q", q);

  return (
    <div className="mx-auto w-full max-w-5xl px-7 py-8">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground"
      >
        ← Dashboard
      </Link>

      <div className="mb-5.5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {detail.project.name}
          </h1>
          <ProjectClientForm
            projectId={detail.project.id}
            clientName={detail.project.clientName}
          />
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/projects/${projectId}/sessions/export?${exportParams.toString()}`}
            className="rounded-lg border border-border px-3.5 py-2 text-[13px] text-foreground hover:bg-white/[0.03]"
          >
            Export CSV
          </a>
          <DeleteProjectButton projectId={detail.project.id} />
        </div>
      </div>

      <div className="mb-5.5 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface px-4.5 py-4">
          <div className="mb-1.5 text-xs text-muted">Total time (mo.)</div>
          <div className="font-mono text-[21px] font-semibold">
            {formatDuration(detail.monthMinutes)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4.5 py-4">
          <div className="mb-1.5 text-xs text-muted">AI cost (mo.)</div>
          <div className="font-mono text-[21px] font-semibold text-accent">
            {formatMoney(detail.monthAiCost, detail.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4.5 py-4">
          <div className="mb-1.5 text-xs text-muted">Total cost (mo.)</div>
          <div className="font-mono text-[21px] font-semibold">
            {formatMoney(detail.monthTotalCost, detail.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4.5 py-4">
          <div className="mb-1.5 text-xs text-muted">Sessions shown</div>
          <div className="font-mono text-[21px] font-semibold">
            {filtered.length}
          </div>
        </div>
      </div>

      <ProjectFilters />

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-[1fr_1.8fr_0.9fr_1.1fr_0.9fr_auto] px-5.5 py-3 text-[11.5px] uppercase tracking-wide text-muted border-b border-border">
          <span>Date</span>
          <span>Ticket / branch</span>
          <span>Duration</span>
          <span>Tokens</span>
          <span>AI cost</span>
          <span></span>
        </div>

        {filtered.length === 0 && (
          <div className="px-5.5 py-10 text-center text-sm text-muted">
            No sessions match this filter.
          </div>
        )}

        {filtered.map((s) => (
          <div
            key={s.id}
            className="grid grid-cols-[1fr_1.8fr_0.9fr_1.1fr_0.9fr_auto] items-center px-5.5 py-3.5 border-b border-border/60 last:border-b-0"
          >
            <span className="font-mono text-[12.5px] text-muted">
              {s.startedAt.toLocaleDateString()}
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px]">{s.ticketRef ?? "—"}</span>
              <span className="font-mono text-[11.5px] text-dim">
                {s.gitBranch ?? "—"}
              </span>
            </div>
            <span className="font-mono text-[13px]">
              {formatDuration(sessionMinutes(s))}
            </span>
            <span className="font-mono text-[13px] text-muted">
              {formatTokens(s.tokensInput + s.tokensOutput)}
            </span>
            <span className="font-mono text-[13px] text-accent">
              {formatMoney(detail.sessionCost(s), detail.currency)}
            </span>
            <DeleteSessionButton sessionId={s.id} projectId={detail.project.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
