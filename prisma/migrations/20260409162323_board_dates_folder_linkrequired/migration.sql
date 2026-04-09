-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "folder" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ChallengeTask" ADD COLUMN     "linkRequired" BOOLEAN NOT NULL DEFAULT false;
