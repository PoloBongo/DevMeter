import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import type { PricingMode, Session } from "@/generated/prisma/client";
import { convertFromUsd, type Currency } from "@/lib/currency";

export type ProjectSummary = {
  id: string;
  name: string;
  clientName: string | null;
  lastActivity: Date | null;
  monthMinutes: number;
  monthAiCost: number;
  /** Raw token-based estimate, ignoring pricing mode — shown as an FYI next to monthAiCost when they differ. */
  monthAiCostPaygEquivalent: number;
  monthTotalCost: number;
};

export type ProjectOption = { id: string; name: string };

export type BreakEven = {
  subscriptionCost: number;
  paygEquivalent: number;
  reached: boolean;
  delta: number;
};

type Pricing = {
  mode: PricingMode;
  currency: Currency;
  subscriptionCost: number;
  totalMonthTokens: number;
};

function sessionTokens(
  session: Pick<
    Session,
    "tokensInput" | "tokensOutput" | "tokensCacheRead" | "tokensCacheCreation"
  >
): number {
  return (
    session.tokensInput +
    session.tokensOutput +
    session.tokensCacheRead +
    session.tokensCacheCreation
  );
}

function paygEquivalentUsd(
  session: Pick<Session, "estimatedCostUsd">
): number {
  return Number(session.estimatedCostUsd);
}

/**
 * PAYG: the token-based estimate the collector recorded, converted to the display currency.
 * SUBSCRIPTION_FLAT: AI cost is already covered by a flat monthly fee — no marginal cost per session.
 * SUBSCRIPTION_AMORTIZED: spread the flat monthly fee across sessions by their share of that month's tokens.
 * (subscriptionCost is entered directly in the display currency, so it needs no conversion.)
 */
function effectiveSessionCost(
  session: Pick<
    Session,
    "tokensInput" | "tokensOutput" | "tokensCacheRead" | "tokensCacheCreation" | "estimatedCostUsd"
  >,
  pricing: Pricing
): number {
  if (pricing.mode === "SUBSCRIPTION_FLAT") return 0;
  if (pricing.mode === "SUBSCRIPTION_AMORTIZED") {
    if (pricing.totalMonthTokens === 0) return 0;
    return (
      (sessionTokens(session) / pricing.totalMonthTokens) *
      pricing.subscriptionCost
    );
  }
  return convertFromUsd(paygEquivalentUsd(session), pricing.currency);
}

function computeBreakEven(
  pricing: Pricing,
  monthSessions: Pick<Session, "estimatedCostUsd">[]
): BreakEven | null {
  if (pricing.mode === "PAYG" || pricing.subscriptionCost <= 0) return null;

  const paygEquivalent = convertFromUsd(
    monthSessions.reduce((sum, s) => sum + paygEquivalentUsd(s), 0),
    pricing.currency
  );

  return {
    subscriptionCost: pricing.subscriptionCost,
    paygEquivalent,
    reached: paygEquivalent >= pricing.subscriptionCost,
    delta: pricing.subscriptionCost - paygEquivalent,
  };
}

export type DailyPoint = {
  date: string;
  hours: number;
  aiCost: number;
};

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function sessionMinutes(
  session: Pick<Session, "startedAt" | "endedAt">
): number {
  if (!session.endedAt) return 0;
  return Math.max(
    0,
    (session.endedAt.getTime() - session.startedAt.getTime()) / 60_000
  );
}

function buildDailySeries(
  sessions: Session[],
  days: number,
  pricing: Pricing
): DailyPoint[] {
  const points: DailyPoint[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const daySessions = sessions.filter(
      (s) => s.startedAt >= day && s.startedAt < nextDay
    );

    points.push({
      date: day.toISOString().slice(0, 10),
      hours: daySessions.reduce((sum, s) => sum + sessionMinutes(s), 0) / 60,
      aiCost: daySessions.reduce(
        (sum, s) => sum + effectiveSessionCost(s, pricing),
        0
      ),
    });
  }

  return points;
}

export async function getDashboardData(
  userId: string,
  filter?: { projectId?: string }
) {
  const user = await requireUser(userId);
  const allProjects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { sessions: { orderBy: { startedAt: "desc" } } },
  });

  const monthStart = startOfMonth(new Date());
  const hourlyRate = Number(user.hourlyRate);

  // Pricing denominator (amortization share, break-even) is always
  // account-wide — a subscription isn't scoped to one project.
  const allMonthSessions = allProjects
    .flatMap((p) => p.sessions)
    .filter((s) => s.startedAt >= monthStart);
  const totalMonthTokens = allMonthSessions.reduce(
    (sum, s) => sum + sessionTokens(s),
    0
  );
  const pricing: Pricing = {
    mode: user.pricingMode,
    currency: user.currency,
    subscriptionCost: Number(user.subscriptionCost ?? 0),
    totalMonthTokens,
  };

  const projects = filter?.projectId
    ? allProjects.filter((p) => p.id === filter.projectId)
    : allProjects;

  const projectSummaries: ProjectSummary[] = projects.map((project) => {
    const monthSessions = project.sessions.filter(
      (s) => s.startedAt >= monthStart
    );
    const monthMinutes = monthSessions.reduce(
      (sum, s) => sum + sessionMinutes(s),
      0
    );
    const monthAiCost = monthSessions.reduce(
      (sum, s) => sum + effectiveSessionCost(s, pricing),
      0
    );
    const monthAiCostPaygEquivalent = convertFromUsd(
      monthSessions.reduce((sum, s) => sum + paygEquivalentUsd(s), 0),
      pricing.currency
    );

    return {
      id: project.id,
      name: project.name,
      clientName: project.clientName,
      lastActivity: project.sessions[0]?.startedAt ?? null,
      monthMinutes,
      monthAiCost,
      monthAiCostPaygEquivalent,
      monthTotalCost: (monthMinutes / 60) * hourlyRate + monthAiCost,
    };
  });

  const filteredSessions = projects.flatMap((p) => p.sessions);

  return {
    currency: user.currency,
    hourlyRate,
    pricingMode: user.pricingMode,
    projectOptions: allProjects.map((p): ProjectOption => ({ id: p.id, name: p.name })),
    projectSummaries,
    breakEven: computeBreakEven(pricing, allMonthSessions),
    totalMonthMinutes: projectSummaries.reduce(
      (sum, p) => sum + p.monthMinutes,
      0
    ),
    totalMonthAiCost: projectSummaries.reduce(
      (sum, p) => sum + p.monthAiCost,
      0
    ),
    totalMonthAiCostPaygEquivalent: projectSummaries.reduce(
      (sum, p) => sum + p.monthAiCostPaygEquivalent,
      0
    ),
    totalMonthCost: projectSummaries.reduce(
      (sum, p) => sum + p.monthTotalCost,
      0
    ),
    series: buildDailySeries(filteredSessions, 30, pricing),
  };
}

export type SessionFilter = {
  range?: "7" | "30" | "all";
  q?: string;
};

export function filterSessions(
  sessions: Session[],
  filter: SessionFilter
): Session[] {
  let result = sessions;

  if (filter.range === "7" || filter.range === "30") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(filter.range));
    result = result.filter((s) => s.startedAt >= cutoff);
  }

  if (filter.q) {
    const needle = filter.q.toLowerCase();
    result = result.filter(
      (s) =>
        (s.ticketRef?.toLowerCase().includes(needle) ?? false) ||
        (s.gitBranch?.toLowerCase().includes(needle) ?? false)
    );
  }

  return result;
}

export async function getProjectDetail(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: { sessions: { orderBy: { startedAt: "desc" } } },
  });

  if (!project) return null;

  const user = await requireUser(userId);
  const hourlyRate = Number(user.hourlyRate);
  const monthStart = startOfMonth(new Date());

  const monthTokensAgg = await prisma.session.aggregate({
    where: { project: { userId }, startedAt: { gte: monthStart } },
    _sum: {
      tokensInput: true,
      tokensOutput: true,
      tokensCacheRead: true,
      tokensCacheCreation: true,
    },
  });
  const totalMonthTokens =
    (monthTokensAgg._sum.tokensInput ?? 0) +
    (monthTokensAgg._sum.tokensOutput ?? 0) +
    (monthTokensAgg._sum.tokensCacheRead ?? 0) +
    (monthTokensAgg._sum.tokensCacheCreation ?? 0);

  const pricing: Pricing = {
    mode: user.pricingMode,
    currency: user.currency,
    subscriptionCost: Number(user.subscriptionCost ?? 0),
    totalMonthTokens,
  };

  const monthSessions = project.sessions.filter(
    (s) => s.startedAt >= monthStart
  );
  const monthMinutes = monthSessions.reduce(
    (sum, s) => sum + sessionMinutes(s),
    0
  );
  const monthAiCost = monthSessions.reduce(
    (sum, s) => sum + effectiveSessionCost(s, pricing),
    0
  );
  const monthAiCostPaygEquivalent = convertFromUsd(
    monthSessions.reduce((sum, s) => sum + paygEquivalentUsd(s), 0),
    pricing.currency
  );

  return {
    project,
    currency: user.currency,
    hourlyRate,
    pricingMode: user.pricingMode,
    monthMinutes,
    monthAiCost,
    monthAiCostPaygEquivalent,
    monthTotalCost: (monthMinutes / 60) * hourlyRate + monthAiCost,
    sessionMinutes,
    sessionCost: (session: Session) => effectiveSessionCost(session, pricing),
    sessionCostPaygEquivalent: (session: Session) =>
      convertFromUsd(paygEquivalentUsd(session), pricing.currency),
  };
}
