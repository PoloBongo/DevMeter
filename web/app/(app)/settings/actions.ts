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

const rateSchema = z.discriminatedUnion("rateMode", [
  z.object({
    rateMode: z.literal("HOURLY"),
    hourlyRate: z.coerce.number().min(0).max(1000),
  }),
  z.object({
    rateMode: z.literal("DAILY"),
    dailyRate: z.coerce.number().min(0).max(8000),
    hoursPerDay: z.coerce.number().min(1).max(24),
  }),
]);

export async function updateHourlyRateAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const parsed = rateSchema.safeParse({
    rateMode: formData.get("rateMode"),
    hourlyRate: formData.get("hourlyRate"),
    dailyRate: formData.get("dailyRate"),
    hoursPerDay: formData.get("hoursPerDay"),
  });
  if (!parsed.success) return;

  const data =
    parsed.data.rateMode === "DAILY"
      ? {
          rateMode: "DAILY" as const,
          dailyRate: parsed.data.dailyRate,
          hoursPerDay: parsed.data.hoursPerDay,
          hourlyRate: parsed.data.dailyRate / parsed.data.hoursPerDay,
        }
      : {
          rateMode: "HOURLY" as const,
          dailyRate: null,
          hourlyRate: parsed.data.hourlyRate,
        };

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  revalidatePath("/settings");
}

const pricingSchema = z.object({
  pricingMode: z.enum(["PAYG", "SUBSCRIPTION_FLAT", "SUBSCRIPTION_AMORTIZED"]),
  subscriptionCost: z.coerce.number().min(0).max(10000).optional(),
});

export async function updatePricingModeAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const raw = formData.get("subscriptionCost");
  const parsed = pricingSchema.safeParse({
    pricingMode: formData.get("pricingMode"),
    subscriptionCost: raw ? raw : undefined,
  });
  if (!parsed.success) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      pricingMode: parsed.data.pricingMode,
      subscriptionCost:
        parsed.data.pricingMode === "PAYG"
          ? null
          : (parsed.data.subscriptionCost ?? 0),
    },
  });

  revalidatePath("/settings");
}

const budgetSchema = z.object({
  budgetAmount: z.coerce.number().min(0).max(1000000).optional(),
});

export async function updateBudgetAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const enabled = formData.get("budgetEnabled") === "on";
  const raw = formData.get("budgetAmount");
  const parsed = budgetSchema.safeParse({
    budgetAmount: enabled && raw ? raw : undefined,
  });
  if (!parsed.success) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      budgetAmount: enabled ? (parsed.data.budgetAmount ?? 0) : null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

const currencySchema = z.object({
  currency: z.enum(["USD", "EUR"]),
});

export async function updateCurrencyAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const parsed = currencySchema.safeParse({
    currency: formData.get("currency"),
  });
  if (!parsed.success) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { currency: parsed.data.currency },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
