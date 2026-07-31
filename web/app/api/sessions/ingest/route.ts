import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashApiKey } from "@/lib/api-key";

const modelBucketSchema = z.object({
  input: z.number().int().min(0),
  output: z.number().int().min(0),
  cacheRead: z.number().int().min(0),
  cacheCreation: z.number().int().min(0),
  costUsd: z.number().min(0),
});

const ingestSchema = z.object({
  clientSessionId: z.string().trim().min(1).max(200).optional(),
  projectName: z.string().trim().min(1).max(120),
  clientName: z.string().trim().max(120).optional(),
  gitBranch: z.string().trim().max(200).optional(),
  ticketRef: z.string().trim().max(200).optional(),
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime(),
  tokensInput: z.number().int().min(0),
  tokensOutput: z.number().int().min(0),
  tokensCacheRead: z.number().int().min(0).default(0),
  tokensCacheCreation: z.number().int().min(0).default(0),
  estimatedCostUsd: z.number().min(0),
  // Optional so older collector builds (pre-2026-07-31) still ingest fine.
  modelBreakdown: z.record(z.string(), modelBucketSchema).optional(),
});

function extractApiKey(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }
  return request.headers.get("x-api-key");
}

export async function POST(request: Request) {
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { apiKeyHash: hashApiKey(apiKey) },
  });
  if (!user) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const startedAt = new Date(data.startedAt);
  const endedAt = new Date(data.endedAt);
  if (endedAt < startedAt) {
    return NextResponse.json(
      { error: "endedAt must not be before startedAt" },
      { status: 400 }
    );
  }

  const project = await prisma.project.upsert({
    where: { userId_name: { userId: user.id, name: data.projectName } },
    create: {
      userId: user.id,
      name: data.projectName,
      clientName: data.clientName ?? null,
    },
    update: {},
  });

  const sessionFields = {
    projectId: project.id,
    gitBranch: data.gitBranch ?? null,
    ticketRef: data.ticketRef ?? null,
    startedAt,
    endedAt,
    tokensInput: data.tokensInput,
    tokensOutput: data.tokensOutput,
    tokensCacheRead: data.tokensCacheRead,
    tokensCacheCreation: data.tokensCacheCreation,
    estimatedCostUsd: data.estimatedCostUsd,
    modelBreakdown: data.modelBreakdown ?? undefined,
  };

  // A clientSessionId lets the collector send periodic "session still in
  // progress" snapshots (every 5 min, or via `devmeter sync`) that update
  // the same row instead of creating a new session on every push.
  if (data.clientSessionId) {
    const existing = await prisma.session.findUnique({
      where: { clientSessionId: data.clientSessionId },
      include: { project: true },
    });
    if (existing && existing.project.userId !== user.id) {
      return NextResponse.json({ error: "Session ID conflict" }, { status: 409 });
    }

    const created = await prisma.session.upsert({
      where: { clientSessionId: data.clientSessionId },
      create: { ...sessionFields, clientSessionId: data.clientSessionId },
      update: sessionFields,
    });
    return NextResponse.json({ id: created.id, projectId: project.id }, { status: 201 });
  }

  const created = await prisma.session.create({ data: sessionFields });
  return NextResponse.json({ id: created.id, projectId: project.id }, { status: 201 });
}
