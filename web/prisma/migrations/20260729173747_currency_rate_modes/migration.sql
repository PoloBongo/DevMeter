/*
  Warnings:

  - You are about to drop the column `subscriptionCostUsd` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR');

-- CreateEnum
CREATE TYPE "RateMode" AS ENUM ('HOURLY', 'DAILY');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "subscriptionCostUsd",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'EUR',
ADD COLUMN     "dailyRate" DECIMAL(10,2),
ADD COLUMN     "hoursPerDay" DECIMAL(4,1) NOT NULL DEFAULT 7,
ADD COLUMN     "rateMode" "RateMode" NOT NULL DEFAULT 'HOURLY',
ADD COLUMN     "subscriptionCost" DECIMAL(10,2);
