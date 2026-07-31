import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  filterSessions,
  getProjectDetail,
  groupSessionsByDay,
  sessionMinutes,
  type SessionRowData,
} from "@/lib/queries";
import { formatDuration } from "@/lib/format";
import { formatMoney } from "@/lib/currency";
import { ProjectFilters } from "@/components/project-filters";
import { ProjectClientForm } from "@/components/project-client-form";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { SessionTable } from "@/components/session-table";
import { ToastFromQuery } from "@/components/toast-from-query";

const DAYS_PER_PAGE = 10;

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ range?: string; q?: string; page?: string }>;
}) {
  const session = await auth();
  const { projectId } = await params;
  const { range, q, page } = await searchParams;

  const detail = await getProjectDetail(session!.user.id, projectId);
  if (!detail) notFound();

  const normalizedRange = range === "7" || range === "all" ? range : "30";
  const filtered = filterSessions(detail.project.sessions, {
    range: normalizedRange,
    q,
  });

  const rows: SessionRowData[] = filtered.map((s) => ({
    id: s.id,
    startedAt: s.startedAt.toISOString(),
    ticketRef: s.ticketRef,
    gitBranch: s.gitBranch,
    durationMinutes: sessionMinutes(s),
    tokensInput: s.tokensInput,
    tokensOutput: s.tokensOutput,
    tokensCacheRead: s.tokensCacheRead,
    tokensCacheCreation: s.tokensCacheCreation,
    cost: detail.sessionCost(s),
    paygCost: detail.sessionCostPaygEquivalent(s),
  }));

  const dayGroups = groupSessionsByDay(rows);
  const totalPages = Math.max(1, Math.ceil(dayGroups.length / DAYS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const pagedGroups = dayGroups.slice(
    (currentPage - 1) * DAYS_PER_PAGE,
    currentPage * DAYS_PER_PAGE
  );

  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set("range", normalizedRange);
    if (q) params.set("q", q);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `?${query}` : "";
  };

  const exportParams = new URLSearchParams();
  exportParams.set("range", normalizedRange);
  if (q) exportParams.set("q", q);

  const showPaygHint = detail.pricingMode !== "PAYG";

  return (
    <div className="mx-auto w-full max-w-5xl px-7 py-8">
      <ToastFromQuery />
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
          {showPaygHint &&
            Math.round(detail.monthAiCostPaygEquivalent * 100) !==
              Math.round(detail.monthAiCost * 100) && (
              <div className="mt-0.5 text-[11px] text-dim">
                ≈ {formatMoney(detail.monthAiCostPaygEquivalent, detail.currency)}{" "}
                payg
              </div>
            )}
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

        <SessionTable
          dayGroups={pagedGroups}
          projectId={detail.project.id}
          currency={detail.currency}
          showPaygHint={showPaygHint}
        />
      </div>

      {totalPages > 1 && (
        <div className="mt-3.5 flex items-center justify-center gap-3 text-[13px]">
          <Link
            href={pageHref(currentPage - 1)}
            aria-disabled={currentPage <= 1}
            className={`rounded-lg border border-border px-3 py-1.5 ${
              currentPage <= 1
                ? "pointer-events-none text-dim"
                : "text-foreground hover:bg-white/[0.03]"
            }`}
          >
            ← Prev
          </Link>
          <span className="text-muted">
            Page {currentPage} of {totalPages}
          </span>
          <Link
            href={pageHref(currentPage + 1)}
            aria-disabled={currentPage >= totalPages}
            className={`rounded-lg border border-border px-3 py-1.5 ${
              currentPage >= totalPages
                ? "pointer-events-none text-dim"
                : "text-foreground hover:bg-white/[0.03]"
            }`}
          >
            Next →
          </Link>
        </div>
      )}
    </div>
  );
}
