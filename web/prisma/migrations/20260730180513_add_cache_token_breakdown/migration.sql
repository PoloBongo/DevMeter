-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "clientSessionId" TEXT,
ADD COLUMN     "tokensCacheRead" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tokensCacheCreation" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Session_clientSessionId_key" ON "Session"("clientSessionId");
