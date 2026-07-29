-- CreateEnum
CREATE TYPE "PricingMode" AS ENUM ('PAYG', 'SUBSCRIPTION_FLAT', 'SUBSCRIPTION_AMORTIZED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pricingMode" "PricingMode" NOT NULL DEFAULT 'PAYG',
ADD COLUMN     "subscriptionCostUsd" DECIMAL(10,2);
