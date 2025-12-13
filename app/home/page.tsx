import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { stackServerApp } from "@/stack/server";

// Utility to format currency
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);

export default async function Home() {
  await stackServerApp.getUser({ or: "redirect" });

  const productsCount = await prisma.product.count();
  const ordersCount = await prisma.order.count();
  const totalRevenue = await prisma.order.aggregate({
    _sum: { total: true },
  });

  // Orders by month (last 6 months)
  const ordersByMonth = await prisma.$queryRaw<
    { month: string; total: number }[]
  >`
    SELECT TO_CHAR("createdAt", 'Mon') AS month, SUM("totalAmount")::numeric AS total
    FROM "Order"
    GROUP BY TO_CHAR("createdAt", 'Mon')
    ORDER BY MIN("createdAt") DESC
    LIMIT 6
  `;

  // Orders by status
  const ordersByStatus = await prisma.order.groupBy({
    by: ["status"],
    _sum: { total: true },
  });

  // Top products by revenue
  const topProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { unitPrice: true },
    orderBy: { _sum: { unitPrice: "desc" } },
    take: 5,
  });

  // Fetch product names for top products
  const productNames = await prisma.product.findMany({
    where: { id: { in: topProducts.map((p) => p.productId) } },
    select: { id: true, name: true },
  });
  const productMap = Object.fromEntries(
    productNames.map((p) => [p.id, p.name])
  );

  // Top customers by spend
  const topCustomers = await prisma.order.groupBy({
    by: ["customerId"],
    _sum: { total: true },
    orderBy: { _sum: { total: "desc" } },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/products"
          className="bg-white shadow rounded-lg p-6 hover:bg-gray-100 transition"
        >
          <h2 className="text-lg font-semibold text-gray-700">Products</h2>
          <p className="text-2xl font-bold">{productsCount}</p>
        </Link>
        <Link
          href="/orders"
          className="bg-white shadow rounded-lg p-6 hover:bg-gray-100 transition"
        >
          <h2 className="text-lg font-semibold text-gray-700">Orders</h2>
          <p className="text-2xl font-bold">{ordersCount}</p>
        </Link>
        <Link
          href="/orders?status=Completed"
          className="bg-white shadow rounded-lg p-6 hover:bg-gray-100 transition"
        >
          <h2 className="text-lg font-semibold text-gray-700">Revenue</h2>

          <p className="text-2xl font-bold">
            {formatCurrency(
              Math.round(totalRevenue._sum.total?.toNumber() || 0)
            )}{" "}
          </p>
        </Link>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Orders by Month */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Orders by Month</h2>
          <svg width="100%" height="200">
            {ordersByMonth.map((item, i) => {
              const barHeight =
                (item.total / (ordersByMonth[0].total || 1)) * 150;
              return (
                <Link key={i} href={`/orders?month=${item.month}`}>
                  <rect
                    x={i * 60 + 20}
                    y={180 - barHeight}
                    width="40"
                    height={barHeight}
                    fill="#3b82f6"
                  />
                  <text x={i * 60 + 20} y={195} fontSize="12">
                    {item.month}
                  </text>
                </Link>
              );
            })}
          </svg>
        </div>

        {/* Orders by Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Revenue by Status</h2>
          <ul>
            {ordersByStatus.map((status, i) => (
              <li key={i} className="flex justify-between py-1">
                <Link
                  href={`/orders?status=${status.status}`}
                  className="text-blue-600 hover:underline"
                >
                  {status.status}
                </Link>
                <span>
                  {formatCurrency(Math.round(Number(status._sum.total || 0)))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Top Products</h2>
          <ul>
            {topProducts.map((p, i) => (
              <li key={i} className="flex justify-between py-1">
                <Link
                  href={`/products/${p.productId}/order-items`}
                  className="text-blue-600 hover:underline"
                >
                  {productMap[p.productId] || "Unknown"}
                </Link>
                <span>{formatCurrency(Number(p._sum.unitPrice || 0))}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Customers */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Top Customers</h2>
          <ul>
            {topCustomers.map((c, i) => (
              <li key={i} className="flex justify-between py-1">
                <Link
                  href={`/orders?customer=${encodeURIComponent(
                    c.customerId ?? ""
                  )}`}
                  className="text-blue-600 hover:underline"
                >
                  {c.customerId ?? "Unknown"}
                </Link>

                <span>{formatCurrency(Number(c._sum?.total || 0))}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
