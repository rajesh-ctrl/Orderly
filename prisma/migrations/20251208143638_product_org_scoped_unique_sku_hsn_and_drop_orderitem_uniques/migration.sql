/*
  Warnings:

  - You are about to drop the column `customerName` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceNumber` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `defaultPrice` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `sellingPrice` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[organisationId,sku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organisationId,HSN]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdByEmail` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organisationId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalTaxAmount` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedByEmail` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `HSN` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `actualprice` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdByEmail` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lineTaxAmount` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lineTotal` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organisationId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productname` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sku` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxRatePct` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedByEmail` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `HSN` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdByEmail` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxRatePct` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedByEmail` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_organisationId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_userId_fkey";

-- DropIndex
DROP INDEX "Product_sku_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "customerName",
DROP COLUMN "invoiceNumber",
DROP COLUMN "status",
DROP COLUMN "totalAmount",
ADD COLUMN     "additionalCharges" JSONB,
ADD COLUMN     "createdByEmail" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "organisationId" TEXT NOT NULL,
ADD COLUMN     "subtotal" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "taxBreakdownJson" JSONB,
ADD COLUMN     "taxBreakdownText" TEXT,
ADD COLUMN     "taxInclusive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "total" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "totalTaxAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedByEmail" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "defaultPrice",
DROP COLUMN "sellingPrice",
ADD COLUMN     "HSN" TEXT NOT NULL,
ADD COLUMN     "actualprice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "createdByEmail" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "lineTaxAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "lineTotal" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "organisationId" TEXT NOT NULL,
ADD COLUMN     "productname" TEXT NOT NULL,
ADD COLUMN     "sku" TEXT NOT NULL,
ADD COLUMN     "taxRatePct" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "unitPrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "updatedByEmail" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "stock",
ADD COLUMN     "HSN" TEXT NOT NULL,
ADD COLUMN     "createdByEmail" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "productTaxDefaults" JSONB,
ADD COLUMN     "taxRatePct" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "updatedByEmail" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Order_organisationId_idx" ON "Order"("organisationId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_organisationId_sku_key" ON "Product"("organisationId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_organisationId_HSN_key" ON "Product"("organisationId", "HSN");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
