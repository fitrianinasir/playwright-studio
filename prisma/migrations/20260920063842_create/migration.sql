/*
  Warnings:

  - Added the required column `user_id` to the `tbl_scenarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tbl_scenarios" ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "tbl_users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_users_username_key" ON "tbl_users"("username");

-- AddForeignKey
ALTER TABLE "tbl_scenarios" ADD CONSTRAINT "tbl_scenarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
