"use server";

import { revalidatePath } from "next/cache";
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
