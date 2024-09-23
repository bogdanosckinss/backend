-- DropForeignKey
ALTER TABLE "video_likes" DROP CONSTRAINT "video_likes_user_id_fkey";

-- AddForeignKey
ALTER TABLE "video_likes" ADD CONSTRAINT "video_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
