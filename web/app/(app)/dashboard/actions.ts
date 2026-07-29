"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  clientName: z.string().trim().max(120).optional(),
});

export async function createProjectAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    clientName: formData.get("clientName") || undefined,
  });

  if (!parsed.success) {
    return;
  }

  await prisma.project.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      clientName: parsed.data.clientName ?? null,
    },
  });

  revalidatePath("/dashboard");
}

const updateClientSchema = z.object({
  projectId: z.string().min(1),
  clientName: z.string().trim().max(120).optional(),
});

export async function updateProjectClientAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const parsed = updateClientSchema.safeParse({
    projectId: formData.get("projectId"),
    clientName: formData.get("clientName") || undefined,
  });
  if (!parsed.success) return;

  await prisma.project.updateMany({
    where: { id: parsed.data.projectId, userId: session.user.id },
    data: { clientName: parsed.data.clientName ?? null },
  });

  revalidatePath(`/dashboard/${parsed.data.projectId}`);
  revalidatePath("/dashboard");
}

const deleteProjectSchema = z.object({
  projectId: z.string().min(1),
});

export async function deleteProjectAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const parsed = deleteProjectSchema.safeParse({
    projectId: formData.get("projectId"),
  });
  if (!parsed.success) return;

  await prisma.project.deleteMany({
    where: { id: parsed.data.projectId, userId: session.user.id },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

const deleteSessionSchema = z.object({
  sessionId: z.string().min(1),
  projectId: z.string().min(1),
});

export async function deleteSessionAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const parsed = deleteSessionSchema.safeParse({
    sessionId: formData.get("sessionId"),
    projectId: formData.get("projectId"),
  });
  if (!parsed.success) return;

  await prisma.session.deleteMany({
    where: {
      id: parsed.data.sessionId,
      project: { id: parsed.data.projectId, userId: session.user.id },
    },
  });

  revalidatePath(`/dashboard/${parsed.data.projectId}`);
  revalidatePath("/dashboard");
}
