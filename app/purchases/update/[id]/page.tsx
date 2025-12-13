import { prisma } from "@/lib/prisma";

import { Link } from "lucide-react";
import EditPurchaseForm from "./EditPurchaseForm";
import PurchaseInvoiceView from "@/components/PurchaseInvoiceView";

export default async function EditPurchasePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const purchaseId = Number(id);

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { items: { include: { product: true } } },
  });

  if (!purchase) return <div>Purchase not found</div>;

  return (
    <div className="p-6 space-y-6">
      <EditPurchaseForm
        purchaseId={purchase.id}
        initialStatus={purchase.status} // ✅ Pass actual status from DB
        // onSubmit={updatePurchaseStatus}
      />
      <PurchaseInvoiceView purchase={purchase} />
      {/* Below this, you can render your EditPurchaseForm for status change */}
    </div>
  );
}
