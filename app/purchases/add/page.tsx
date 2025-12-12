// app/purchases/add/page.tsx
import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import AddPurchaseForm from "./AddPurchaseForm";
import Link from "next/link";

export default async function AddPurchasePage() {
  const { appUser } = await requireVerifiedUser();
  if (!appUser.currentOrganisationId) notFound();
  const orgId = appUser.currentOrganisationId!;

  // Load products for org (needed fields for the form)
  const products = await prisma.product.findMany({
    where: { organisationId: orgId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      HSN: true,
      transferprice: true,
      price: true,
      currency: true,
      taxRatePct: true,
    },
  });

  // Suppliers in org
  const suppliers = await prisma.supplier.findMany({
    where: { organisationId: orgId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // Contacts belonging to suppliers in org
  const contacts = await prisma.contact.findMany({
    where: { organisationId: orgId, supplierId: { not: null } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, supplierId: true },
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Add Purchase</h1>
          <p className="text-sm text-gray-600">Create a new Purchase Order</p>
        </div>
        <Link
          href="/purchases"
          className="px-3 py-2 rounded border bg-white text-gray-800 hover:bg-gray-50"
        >
          ← Back to Purchases
        </Link>
      </div>

      {/* Client component form */}
      <AddPurchaseForm
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          HSN: p.HSN,
          transferprice: Number(p.transferprice),
          price: Number(p.price),
          currency: p.currency,
          taxRatePct: Number(p.taxRatePct),
        }))}
        suppliers={suppliers}
        contacts={contacts.map((c) => ({
          id: c.id,
          name: c.name,
          supplierId: c.supplierId,
        }))}
      />
    </div>
  );
}
