/*
  Warnings:

  - You are about to drop the column `notes` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `reference` on the `Purchase` table. All the data in the column will be lost.
  - Added the required column `actualprice` to the `PurchaseItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `sku` on table `PurchaseItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `HSN` on table `PurchaseItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "notes",
DROP COLUMN "reference";

-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "actualprice" DECIMAL(10,2) NOT NULL,
ALTER COLUMN "sku" SET NOT NULL,
ALTER COLUMN "HSN" SET NOT NULL;

-- CreateIndex
CREATE INDEX "OrderItem_organisationId_idx" ON "OrderItem"("organisationId");
