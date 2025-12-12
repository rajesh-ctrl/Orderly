// app/orders/add/page.tsx
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth";
import AddOrderForm from "./AddOrderform";
import { redirect } from "next/navigation";

export default async function AddOrderPage() {
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
      price: true,
      taxRatePct: true,
      currency: true,
      sku: true,
      HSN: true,
    },
    orderBy: { name: "asc" },
  });

  const [customers, contacts] = await Promise.all([
    prisma.customer.findMany({
      where: { organisationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      where: { organisationId: orgId, customerId: { not: null } },
      select: { id: true, name: true, customerId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    taxRatePct: Number(p.taxRatePct),
    currency: p.currency,
    sku: p.sku,
    HSN: p.HSN,
  }));

  return (
    <AddOrderForm
      products={serializedProducts}
      customers={customers}
      contacts={contacts}
    />
  );
}
