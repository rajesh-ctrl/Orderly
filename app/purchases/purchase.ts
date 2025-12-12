
// app/purchases/purchase.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
const round2 = (n: number) => Math.round(n * 100) / 100;

export async function addPurchase(formData: FormData) {
  const { appUser } = await requireVerifiedUser();
  if (!appUser.currentOrganisationId) throw new Error("No organisation");

  const organisationId = appUser.currentOrganisationId!;
  const createdByEmail = appUser.email || "system@local";
  const updatedByEmail = createdByEmail;

  // Header
  const supplierId = Number(formData.get("supplierId"));
  const contactId = Number(formData.get("contactId") || NaN);
  const currency = String(formData.get("currency") || "INR");
  const status = String(formData.get("status") || "Pending");
  const reference = String(formData.get("reference") || "");

  if (!Number.isFinite(supplierId) || supplierId <= 0) {
    throw new Error("Supplier is required");
  }

  // Items: arrays read in order
  const productIds = formData.getAll("productId").map(v => Number(v));
  const quantities = formData.getAll("quantity").map(v => Number(v));
  const unitPrices = formData.getAll("unitPrice").map(v => Number(v));
  const taxRatePcts = formData.getAll("taxRatePct").map(v => Number(v));

  const itemCount = Math.min(productIds.length, quantities.length, unitPrices.length, taxRatePcts.length);
  if (itemCount === 0) throw new Error("At least one item required");

  let subtotal = 0;
  let totalTaxAmount = 0;

  const itemsData: any[] = [];

  // Snapshot product fields for each item
  for (let i = 0; i < itemCount; i++) {
    const pid = productIds[i];
    const qty = quantities[i];
    const up = unitPrices[i];
    const taxPct = taxRatePcts[i];

    if (!Number.isFinite(pid) || !Number.isFinite(qty) || !Number.isFinite(up)) {
      throw new Error("Invalid item row");
    }

    const product = await prisma.product.findUnique({ where: { id: pid } });
    if (!product) throw new Error("Product not found");

    const lineBase = round2(up * qty);
    const lineTax = round2(lineBase * (Number(taxPct) || 0) * 0.01);
    const lineTotal = round2(lineBase + lineTax);

    subtotal += lineBase;
    totalTaxAmount += lineTax;

    itemsData.push({
      organisationId,
      productId: pid,
      productname: product.name,
      sku: product.sku,
      HSN: product.HSN,
      quantity: qty,
      unitPrice: up,          // purchases snapshot
      taxRatePct: taxPct,
      lineTaxAmount: lineTax,
      lineTotal,
      currency,
      createdByEmail,
      updatedByEmail,
    });
  }

  subtotal = round2(subtotal);
  totalTaxAmount = round2(totalTaxAmount);
  const total = round2(subtotal + totalTaxAmount);

  // Tax components (optional, store whatever user provided)
  const taxComponentNames = formData.getAll("taxComponentName").map(v => String(v));
  const taxComponentPcts = formData.getAll("taxComponentPct").map(v => Number(v));
  const taxComponents: { name: string; percentage: number }[] = [];
  for (let i = 0; i < Math.min(taxComponentNames.length, taxComponentPcts.length); i++) {
    const name = taxComponentNames[i].trim();
    const pct = Number(taxComponentPcts[i] || 0);
    if (name) taxComponents.push({ name, percentage: pct });
  }

  // Additional charges (single)
  const addlName = String(formData.get("additionalChargeName") || "");
  const addlAmt = Number(formData.get("additionalChargeAmount") || 0);
  const additionalCharges = addlName ? { name: addlName, amount: addlAmt } : null;

  const po = await prisma.purchase.create({
    data: {
      organisationId,
      supplierId,
      contactId: Number.isFinite(contactId) ? contactId : null,
      currency,
      status,
      billNumber: null, // optional; keep null unless you use real supplier bill#
      reference: reference || null,
      notes: null,

      subtotal,
      totalTaxAmount,
      total,

      taxBreakdownText: taxComponents.length
        ? taxComponents.map(tc => `${tc.name} ${tc.percentage.toFixed(2)}%`).join(" | ")
        : null,
      taxBreakdownJson: taxComponents.length ? taxComponents : null,

      additionalCharges: additionalCharges,

      createdByEmail,
      updatedByEmail,

      items: { createMany: { data: itemsData } },
    },
  });

 redirect('/purchases');

}