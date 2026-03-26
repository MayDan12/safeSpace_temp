-- AlterTable
ALTER TABLE "users" ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "refresh_token_hash" TEXT;
