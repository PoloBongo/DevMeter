"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findImportTemplate, type ImportedEntry } from "@/lib/imports";

export type ImportedEntryWire = Omit<ImportedEntry, "startedAt" | "endedAt"> & {
  startedAt: string;
  endedAt: string;
};

export type ParsedImport = {
  templateId: string;
  entries: ImportedEntryWire[];
  projectNames: string[];
};

export type ImportResult = {
  batchId: string;
  sessionCount: number;
  projectCount: number;
};

/** Step 1: parse the upload and report the distinct project names found — no DB writes yet, so the caller can map each name before anything is created. */
export async function parseImportFileAction(
  formData: FormData
): Promise<ParsedImport> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const templateId = String(formData.get("templateId") ?? "");
  const template = findImportTemplate(templateId);
  if (!template) {
    throw new Error("Unknown import template.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No file uploaded.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const entries = await template.parse(buffer);
  if (entries.length === 0) {
    throw new Error("No time entries found in that file.");
  }

  return {
    templateId,
    entries: entries.map((e) => ({
      ...e,
      startedAt: e.startedAt.toISOString(),
      endedAt: e.endedAt.toISOString(),
    })),
    projectNames: [...new Set(entries.map((e) => e.projectName))],
  };
}

/**
 * Step 2: create/attach sessions using a per-name mapping the user picked —
 * `mapping[clockifyProjectName]` is either an existing Project id, or the
 * literal string "new" to create a project named after the Clockify project.
 */
export async function confirmImportAction(formData: FormData): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const templateId = String(formData.get("templateId") ?? "");
  const template = findImportTemplate(templateId);
  if (!template) {
    throw new Error("Unknown import template.");
  }

  const entries = JSON.parse(String(formData.get("entriesJson") ?? "[]")) as ImportedEntryWire[];
  const mapping = JSON.parse(String(formData.get("mappingJson") ?? "{}")) as Record<string, string>;
  if (entries.length === 0) {
    throw new Error("Nothing to import.");
  }

  const projectNames = [...new Set(entries.map((e) => e.projectName))];
  const projectIdByName = new Map<string, string>();

  for (const name of projectNames) {
    const target = mapping[name];
    if (target && target !== "new") {
      // Confirm the picked project actually belongs to this user before attaching sessions to it.
      const existing = await prisma.project.findFirst({
        where: { id: target, userId: session.user.id },
      });
      if (!existing) throw new Error(`Invalid project selection for "${name}".`);
      projectIdByName.set(name, existing.id);
      continue;
    }

    const firstEntry = entries.find((e) => e.projectName === name)!;
    const project = await prisma.project.upsert({
      where: { userId_name: { userId: session.user.id, name } },
      create: {
        userId: session.user.id,
        name,
        clientName: firstEntry.clientName,
      },
      update: {},
    });
    projectIdByName.set(name, project.id);
  }

  const importBatchId = randomUUID();
  await prisma.session.createMany({
    data: entries.map((entry) => ({
      projectId: projectIdByName.get(entry.projectName)!,
      ticketRef: entry.description,
      startedAt: new Date(entry.startedAt),
      endedAt: new Date(entry.endedAt),
      source: template.id,
      importBatchId,
    })),
  });

  revalidatePath("/dashboard");
  revalidatePath("/import");

  return {
    batchId: importBatchId,
    sessionCount: entries.length,
    projectCount: projectNames.length,
  };
}

export async function undoImportAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const batchId = String(formData.get("batchId") ?? "");
  if (!batchId) return;

  await prisma.session.deleteMany({
    where: { importBatchId: batchId, project: { userId: session.user.id } },
  });

  revalidatePath("/dashboard");
  revalidatePath("/import");
}
