/*
  Warnings:

  - Changed the type of `status` on the `Transfert` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('IN_PROGRESS', 'NOT_DONE', 'COMPLETED');

-- AlterTable
ALTER TABLE "Transfert" DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL;
