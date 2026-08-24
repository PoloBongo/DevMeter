-- DropIndex
DROP INDEX "Session_projectId_idx";

-- CreateIndex
CREATE INDEX "Session_projectId_startedAt_idx" ON "Session"("projectId", "startedAt");
