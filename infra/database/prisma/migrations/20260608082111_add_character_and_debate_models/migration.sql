-- CreateEnum
CREATE TYPE "CharacterCategory" AS ENUM ('ATTACKER', 'DEFENDER', 'DECONSTRUCTOR');

-- CreateEnum
CREATE TYPE "DebateType" AS ENUM ('COURT', 'CONSULTATION');

-- CreateEnum
CREATE TYPE "DebateStatus" AS ENUM ('PENDING', 'GENERATING', 'CONCLUDED', 'FAILED');

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "era" TEXT NOT NULL,
    "mbti" TEXT NOT NULL,
    "coreStance" TEXT NOT NULL,
    "speakingStyle" TEXT NOT NULL,
    "expertise" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "avatar" TEXT,
    "category" "CharacterCategory" NOT NULL DEFAULT 'DECONSTRUCTOR',
    "isPreset" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debates" (
    "id" TEXT NOT NULL,
    "type" "DebateType" NOT NULL,
    "topic" TEXT NOT NULL,
    "status" "DebateStatus" NOT NULL DEFAULT 'PENDING',
    "rounds" JSONB,
    "conclusion" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debate_characters" (
    "id" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "role" TEXT,

    CONSTRAINT "debate_characters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "characters_slug_key" ON "characters"("slug");

-- CreateIndex
CREATE INDEX "characters_slug_idx" ON "characters"("slug");

-- CreateIndex
CREATE INDEX "characters_isActive_idx" ON "characters"("isActive");

-- CreateIndex
CREATE INDEX "debates_type_idx" ON "debates"("type");

-- CreateIndex
CREATE INDEX "debates_status_idx" ON "debates"("status");

-- CreateIndex
CREATE INDEX "debates_userId_idx" ON "debates"("userId");

-- CreateIndex
CREATE INDEX "debates_createdAt_idx" ON "debates"("createdAt");

-- CreateIndex
CREATE INDEX "debate_characters_debateId_idx" ON "debate_characters"("debateId");

-- CreateIndex
CREATE INDEX "debate_characters_characterId_idx" ON "debate_characters"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "debate_characters_debateId_characterId_key" ON "debate_characters"("debateId", "characterId");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debates" ADD CONSTRAINT "debates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debate_characters" ADD CONSTRAINT "debate_characters_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "debates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debate_characters" ADD CONSTRAINT "debate_characters_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
