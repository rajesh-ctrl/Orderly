/*
  Warnings:

  - You are about to drop the column `billNumber` on the `Purchase` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[organisationId,poNumber]` on the table `Purchase` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `poNumber` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "taxInclusive" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "billNumber",
ADD COLUMN     "poNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_organisationId_poNumber_key" ON "Purchase"("organisationId", "poNumber");
