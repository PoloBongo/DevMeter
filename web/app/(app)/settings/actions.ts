"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiKeyDisplayPrefix, generateApiKey, hashApiKey } from "@/lib/api-key";

export async function regenerateApiKeyAction(): Promise<{ apiKey: string }> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const apiKey = generateApiKey();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      apiKeyHash: hashApiKey(apiKey),
      apiKeyPrefix: apiKeyDisplayPrefix(apiKey),
    },
  });

  revalidatePath("/settings");
  return { apiKey };
}

const rateSchema = z.object({
  hourlyRate: z.coerce.number().min(0).max(1000),
});

export async function updateHourlyRateAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const parsed = rateSchema.safeParse({
    hourlyRate: formData.get("hourlyRate"),
  });
  if (!parsed.success) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { hourlyRate: parsed.data.hourlyRate },
  });

  revalidatePath("/settings");
}
