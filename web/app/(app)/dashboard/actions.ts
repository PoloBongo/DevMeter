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
