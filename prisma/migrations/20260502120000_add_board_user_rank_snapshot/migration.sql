-- CreateTable
CREATE TABLE "BoardUserRankSnapshot" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "completedChallenges" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardUserRankSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BoardUserRankSnapshot_boardId_userId_key" ON "BoardUserRankSnapshot"("boardId", "userId");

-- CreateIndex
CREATE INDEX "BoardUserRankSnapshot_boardId_idx" ON "BoardUserRankSnapshot"("boardId");
