import { prisma } from "@/lib/prisma";
import EditOrderForm from "../[id]/EditOrderForm";
// import { updateOrder, updateOrderStatus } from "@/components/actions";
import { Link } from "lucide-react";

// interface PageProps {
//   params: { id: string };
// }

// export default async function EditOrderPage({ params }: PageProps) {
//   const { id } = await params;
//   const orderId = Number(id);

//   const order = await prisma.order.findUnique({
//     where: { id: orderId },
//     include: {
//       items: {
//         include: {
//           product: true,
//         },
//       },
//     },
//   });

//   if (!order) {
//     return <div className="p-4">Order not found</div>;
//   }

//   return (
//     <div className="p-6">
//       <EditOrderForm
//         orderId={order.id}
//         initialStatus={order.status} // ✅ Pass actual status from DB
//         // onSubmit={updateOrderStatus}
//       />
//     </div>
//   );
// }

import OrderInvoiceView from "../../../../components/OrderInvoiceView";

export default async function EditOrderPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const orderId = Number(id);
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });

  if (!order) return <div>Order not found</div>;

  return (
    <div className="p-6 space-y-6">
      <EditOrderForm
        orderId={order.id}
        initialStatus={order.status} // ✅ Pass actual status from DB
        // onSubmit={updateOrderStatus}
      />
      <OrderInvoiceView order={order} />
      {/* Below this, you can render your EditOrderForm for status change */}
    </div>
  );
}
