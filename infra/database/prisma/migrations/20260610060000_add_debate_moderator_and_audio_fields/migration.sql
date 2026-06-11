-- AlterTable
ALTER TABLE "debates" ADD COLUMN "chapterMetadata" JSONB;
ALTER TABLE "debates" ADD COLUMN "mergedAudioDuration" DOUBLE PRECISION;
ALTER TABLE "debates" ADD COLUMN "mergedAudioUrl" TEXT;
ALTER TABLE "debates" ADD COLUMN "moderatorClosing" JSONB;
ALTER TABLE "debates" ADD COLUMN "moderatorOpening" JSONB;

-- DropColumn (already removed from schema)
ALTER TABLE "characters" DROP COLUMN IF EXISTS "category";
