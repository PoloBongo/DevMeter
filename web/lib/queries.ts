import { prisma } from "@/lib/prisma";
import type { Session } from "@/generated/prisma/client";

export type ProjectSummary = {
  id: string;
  name: string;
  clientName: string | null;
  lastActivity: Date | null;
  monthMinutes: number;
  monthAiCostUsd: number;
  monthTotalCostUsd: number;
};

export type DailyPoint = {
  date: string;
  hours: number;
  aiCostUsd: number;
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

export function sessionCostUsd(
  session: Pick<Session, "estimatedCostUsd">
): number {
  return Number(session.estimatedCostUsd);
}

function buildDailySeries(sessions: Session[], days: number): DailyPoint[] {
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
      aiCostUsd: daySessions.reduce((sum, s) => sum + sessionCostUsd(s), 0),
    });
  }

  return points;
}

export async function getDashboardData(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { sessions: { orderBy: { startedAt: "desc" } } },
  });

  const monthStart = startOfMonth(new Date());
  const hourlyRate = Number(user.hourlyRate);

  const projectSummaries: ProjectSummary[] = projects.map((project) => {
    const monthSessions = project.sessions.filter(
      (s) => s.startedAt >= monthStart
    );
    const monthMinutes = monthSessions.reduce(
      (sum, s) => sum + sessionMinutes(s),
      0
    );
    const monthAiCostUsd = monthSessions.reduce(
      (sum, s) => sum + sessionCostUsd(s),
      0
    );

    return {
      id: project.id,
      name: project.name,
      clientName: project.clientName,
      lastActivity: project.sessions[0]?.startedAt ?? null,
      monthMinutes,
      monthAiCostUsd,
      monthTotalCostUsd: (monthMinutes / 60) * hourlyRate + monthAiCostUsd,
    };
  });

  const allSessions = projects.flatMap((p) => p.sessions);

  return {
    hourlyRate,
    projectSummaries,
    totalMonthMinutes: projectSummaries.reduce(
      (sum, p) => sum + p.monthMinutes,
      0
    ),
    totalMonthAiCostUsd: projectSummaries.reduce(
      (sum, p) => sum + p.monthAiCostUsd,
      0
    ),
    totalMonthCostUsd: projectSummaries.reduce(
      (sum, p) => sum + p.monthTotalCostUsd,
      0
    ),
    series: buildDailySeries(allSessions, 30),
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

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const hourlyRate = Number(user.hourlyRate);
  const monthStart = startOfMonth(new Date());
  const monthSessions = project.sessions.filter(
    (s) => s.startedAt >= monthStart
  );
  const monthMinutes = monthSessions.reduce(
    (sum, s) => sum + sessionMinutes(s),
    0
  );
  const monthAiCostUsd = monthSessions.reduce(
    (sum, s) => sum + sessionCostUsd(s),
    0
  );

  return {
    project,
    hourlyRate,
    monthMinutes,
    monthAiCostUsd,
    monthTotalCostUsd: (monthMinutes / 60) * hourlyRate + monthAiCostUsd,
    sessionMinutes,
    sessionCostUsd,
  };
}
