-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "modelBreakdown" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "budgetAmount" DECIMAL(10,2);
