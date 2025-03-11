/*
  Warnings:

  - The values [IN_PROGRESS,NOT_DONE,COMPLETED] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Transfert` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('in-progress', 'not-done', 'completed');
ALTER TABLE "Transfert" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
COMMIT;

-- AlterTable
ALTER TABLE "Transfert" DROP CONSTRAINT "Transfert_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DEFAULT 'in-progress',
ADD CONSTRAINT "Transfert_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Transfert_id_seq";
