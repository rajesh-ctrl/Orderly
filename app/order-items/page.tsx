import { prisma } from "@/lib/prisma";

export default async function OrderItemsPage() {
  // ✅ Fetch all order items with related order and product details
  const orderItems = await prisma.orderItem.findMany({
    include: {
      order: true,
      product: true,
    },
    orderBy: { orderId: "desc" },
  });

  if (orderItems.length === 0) {
    return <div className="p-6 text-gray-600">No order items found.</div>;
  }

  // ✅ Calculate summary stats
  const totalRevenue = orderItems.reduce(
    (sum, item) => sum + item.unitPrice.toNumber() * item.quantity,
    0
  );

  const totalQuantity = orderItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const completedQty = orderItems
    .filter((item) => item.order.status === "Completed")
    .reduce((sum, item) => sum + item.quantity, 0);

  const pendingQty = orderItems
    .filter((item) => item.order.status === "Pending")
    .reduce((sum, item) => sum + item.quantity, 0);

  const cancelledQty = orderItems
    .filter((item) => item.order.status === "Cancelled")
    .reduce((sum, item) => sum + item.quantity, 0);

  const avgSoldPrice = orderItems.length > 0 ? totalRevenue / totalQuantity : 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">All Order Items</h1>

      {/* ✅ Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <h2 className="text-sm font-semibold text-gray-600">Total Revenue</h2>
          <p className="text-xl font-bold text-green-600">
            ₹{totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <h2 className="text-sm font-semibold text-gray-600">Completed Qty</h2>
          <p className="text-xl font-bold">{completedQty}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <h2 className="text-sm font-semibold text-gray-600">Pending Qty</h2>
          <p className="text-xl font-bold">{pendingQty}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <h2 className="text-sm font-semibold text-gray-600">Cancelled Qty</h2>
          <p className="text-xl font-bold">{cancelledQty}</p>
        </div>
      </div>

      {/* ✅ Additional Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <h2 className="text-sm font-semibold text-gray-600">
            Average Sold Price
          </h2>
          <p className="text-xl font-bold">₹{avgSoldPrice.toFixed(2)}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <h2 className="text-sm font-semibold text-gray-600">
            Total Quantity Sold
          </h2>
          <p className="text-xl font-bold">{totalQuantity}</p>
        </div>
      </div>

      {/* ✅ Table of Order Items */}
      <div className="overflow-x-auto mt-6">
        <table className="w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">Invoice</th>
              <th className="border px-4 py-2">Order Item ID</th>
              <th className="border px-4 py-2">Order ID</th>
              <th className="border px-4 py-2">Product ID</th>
              <th className="border px-4 py-2">Customer</th>
              <th className="border px-4 py-2">Product</th>
              <th className="border px-4 py-2">Default Price</th>
              <th className="border px-4 py-2">Selling Price</th>
              <th className="border px-4 py-2">Quantity</th>
              <th className="border px-4 py-2">Total Price</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Created At</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map((item) => (
              <tr
                key={item.id}
                className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
              >
                <td className="border px-4 py-2">{item.order.invoiceNumber}</td>
                <td className="border px-4 py-2">{item.id}</td>
                <td className="border px-4 py-2">{item.order.id}</td>
                <td className="border px-4 py-2">{item.product.id}</td>
                <td className="border px-4 py-2">{item.order.customerId}</td>
                <td className="border px-4 py-2">{item.product.name}</td>
                <td className="border px-4 py-2">
                  ₹{item.actualprice.toFixed(2)}
                </td>
                <td className="border px-4 py-2">
                  ₹{item.unitPrice.toNumber().toFixed(2)}
                </td>
                <td className="border px-4 py-2">{item.quantity}</td>
                <td className="border px-4 py-2">
                  ₹{(item.unitPrice.toNumber() * item.quantity).toFixed(2)}
                </td>
                <td className="border px-4 py-2">{item.order.status}</td>
                <td className="border px-4 py-2">
                  {item.order.createdAt.toISOString().slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
