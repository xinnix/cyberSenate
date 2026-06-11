-- CreateEnum
CREATE TYPE "AudioStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "debates" ADD COLUMN     "audioStatus" TEXT;

-- CreateTable
CREATE TABLE "debate_audios" (
    "id" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "segmentType" TEXT NOT NULL,
    "characterId" TEXT,
    "characterName" TEXT,
    "voiceId" TEXT NOT NULL,
    "audioUrl" TEXT,
    "audioDuration" DOUBLE PRECISION,
    "textContent" TEXT NOT NULL,
    "status" "AudioStatus" NOT NULL DEFAULT 'PENDING',
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debate_audios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "debate_audios_debateId_idx" ON "debate_audios"("debateId");

-- CreateIndex
CREATE INDEX "debate_audios_debateId_roundNumber_sortOrder_idx" ON "debate_audios"("debateId", "roundNumber", "sortOrder");

-- CreateIndex
CREATE INDEX "debate_audios_status_idx" ON "debate_audios"("status");

-- AddForeignKey
ALTER TABLE "debate_audios" ADD CONSTRAINT "debate_audios_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "debates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
