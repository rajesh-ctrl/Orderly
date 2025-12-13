// app/orders/add/page.tsx
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth";
import AddPurchaseForm from "./AddPurchaseForm";
import { redirect } from "next/navigation";

export default async function AddPurchasePage() {
  const { appUser } = await requireVerifiedUser();
  if (!appUser.currentOrganisationId) {
    redirect("/error?message=No current organisation set");
  }
  const orgId = appUser.currentOrganisationId!;

  const products = await prisma.product.findMany({
    where: { organisationId: orgId },
    select: {
      id: true,
      name: true,
      transferprice: true,
      taxRatePct: true,
      currency: true,
      sku: true,
      HSN: true,
    },
    orderBy: { name: "asc" },
  });

  const [suppliers, contacts] = await Promise.all([
    prisma.supplier.findMany({
      where: { organisationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      where: { organisationId: orgId, supplierId: { not: null } },
      select: { id: true, name: true, supplierId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.transferprice),
    taxRatePct: Number(p.taxRatePct),
    currency: p.currency,
    sku: p.sku,
    HSN: p.HSN,
  }));

  return (
    <AddPurchaseForm
      products={serializedProducts}
      suppliers={suppliers}
      contacts={contacts}
    />
  );
}
