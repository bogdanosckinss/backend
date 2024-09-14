-- DropForeignKey
ALTER TABLE "video_likes" DROP CONSTRAINT "video_likes_video_id_fkey";

-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "preview_url" TEXT DEFAULT '';
