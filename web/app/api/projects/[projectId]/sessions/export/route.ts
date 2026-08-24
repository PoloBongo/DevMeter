import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProjectDetail, sessionMinutes } from "@/lib/queries";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await ctx.params;
  const url = new URL(request.url);
  const range = url.searchParams.get("range");
  const q = url.searchParams.get("q") ?? undefined;
  const normalizedRange = range === "7" || range === "all" ? range : "30";

  const detail = await getProjectDetail(session.user.id, projectId, {
    range: normalizedRange,
    q,
  });
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filtered = detail.project.sessions;

  const header = [
    "date",
    "ticket",
    "branch",
    "duration_minutes",
    "tokens_input",
    "tokens_output",
    "ai_cost_usd",
  ];

  const rows = filtered.map((s) =>
    [
      s.startedAt.toISOString(),
      s.ticketRef ?? "",
      s.gitBranch ?? "",
      sessionMinutes(s).toFixed(1),
      String(s.tokensInput),
      String(s.tokensOutput),
      detail.sessionCost(s).toFixed(4),
    ]
      .map(csvEscape)
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${detail.project.name.replace(/[^a-z0-9-_]+/gi, "_")}-sessions.csv"`,
    },
  });
}
