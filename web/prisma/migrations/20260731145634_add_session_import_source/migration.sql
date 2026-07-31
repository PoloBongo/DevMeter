-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "importBatchId" TEXT,
ADD COLUMN     "source" TEXT;

-- CreateIndex
CREATE INDEX "Session_importBatchId_idx" ON "Session"("importBatchId");
