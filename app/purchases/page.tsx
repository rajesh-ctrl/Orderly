// app/purchases/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth";
import { CirclePlus, Pencil, ReceiptText, Trash2 } from "lucide-react";
import PaginationClient from "@/components/PaginationClient";
import FilterBar from "@/components/FilterBar";
import { deletePurchase } from "./purchase";

/** Per-row currency formatter */
function formatMoney(value: unknown, currency: string) {
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : Number((value as any)?.toString?.() ?? value);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(Number.isFinite(num) ? num : 0);
  } catch {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number.isFinite(num) ? num : 0);
  }
}

type PurchasesPageSearchParams = {
  page?: string;
  status?: string;
  supplier?: string;
  dateRange?: "today" | "week" | "month" | "";

  fromDate?: string;
  toDate?: string;
  month?: string;
  added?: string;
  update?: string;
  delete?: string;
};

export default async function purchasesPage({
  searchParams,
}: {
  searchParams: Promise<PurchasesPageSearchParams>;
}) {
  // ✅ unwrap searchParams (Promise in your setup)
  const params = await searchParams;

  const { appUser } = await requireVerifiedUser();

  const isAdmin = String((appUser as any).role ?? "").toUpperCase() === "ADMIN";

  const currentOrgId = appUser.currentOrganisationId;
  if (!currentOrgId) {
    return (
      <div className="pl-9 pb-20">
        <h2 className="text-red-600">No current organisation set</h2>
        <p>Switch to an organisation to view purchases.</p>
        <div className="mt-4">
          <Link
            href="/org/switch"
            className="inline-flex items-center gap-2 bg-cyan-500 text-white px-3 py-2 rounded text-sm"
          >
            Switch Organisation
          </Link>
        </div>
      </div>
    );
  }

  // ---- Paging ----
  const pageSize = 20;
  const page =
    Number.isFinite(Number(params.page)) && Number(params.page) > 0
      ? Number(params.page)
      : 1;
  const skip = Math.max(0, (page - 1) * pageSize);

  // ---- Filters ----
  const where: any = {
    organisationId: currentOrgId,
  };

  if (params.status) {
    // purchase.status: "Pending" | "Cancelled" | "Paid"
    where.status = params.status;
  }

  if (params.supplier) {
    // Filter by related supplier.name (exact, case-insensitive)
    where.supplier = {
      name: { equals: params.supplier, mode: "insensitive" },
    };
  }

  const now = new Date();
  if (params.fromDate && params.toDate) {
    const from = new Date(params.fromDate);
    const to = new Date(params.toDate);
    if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
      where.createdAt = { gte: from, lte: to };
    }
  } else if (params.dateRange === "today") {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    where.createdAt = { gte: startOfDay };
  } else if (params.dateRange === "week") {
    const startOfWeek = new Date(now);
    // Sunday as start (adjust to Monday if needed)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    where.createdAt = { gte: startOfWeek };
  } else if (params.dateRange === "month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    where.createdAt = { gte: startOfMonth };
  }

  // Month shortcut (e.g., "Nov")
  if (params.month) {
    const year = now.getFullYear();
    const monthIndex = new Date(`${params.month} 1, ${year}`).getMonth(); // "Nov" -> 10
    if (!isNaN(monthIndex)) {
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59);
      where.createdAt = { gte: startDate, lte: endDate };
    }
  }

  // ---- Fetch data ----
  const [totalpurchases, purchases, suppliers] = await Promise.all([
    prisma.purchase.count({ where }),
    prisma.purchase.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        poNumber: true,
        status: true,
        createdAt: true,
        total: true, // Decimal(12,2)
        currency: true,
        supplier: { select: { name: true } },
      },
    }),
    prisma.supplier.findMany({
      where: { organisationId: currentOrgId },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalpurchases / pageSize));

  // Build a helper to preserve query across filters (if needed later)
  // const makeQuery = (extra: Record<string, string>) => {
  //   const qp = new URLSearchParams();
  //   for (const [k, v] of Object.entries(params)) {
  //     if (v) qp.set(k, String(v));
  //   }
  //   for (const [k, v] of Object.entries(extra)) {
  //     qp.set(k, v);
  //   }
  //   return `/purchases?${qp.toString()}`;
  // };

  return (
    <div className="pl-9 pb-20">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-gray-200">
        <div className="w-[90%] mx-auto mt-2 mb-3">
          {/* Top row: title, FilterBar, New purchase */}
          <div className="flex flex-wrap items-start gap-3 justify-between">
            {/* Left: Title + subtitle */}
            <div className="min-w-[60]">
              <h1 className="text-xl font-bold pb-1 hidden xl:flex">
                purchase List
              </h1>
              <p className="text-gray-600 text-xs lg:text-sm hidden xl:flex">
                Manage purchase status and generate Purchase order
              </p>
            </div>

            {/* Middle: FilterBar (your existing component) */}
            {/*
            <div className="flex-1 min-w-[280px]">
              <FilterBar suppliers={suppliers.map((c) => c.name || "")} />
            </div>
            */}

            {/* Right: New purchase */}
            <div className="min-w-[140px] flex justify-end">
              <Link
                href="/purchases/add"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors
                  focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:pointer-events-none disabled:opacity-50
                  border border-gray-300 bg-white shadow-sm hover:bg-gray-100 hover:text-gray-800
                  h-8 rounded-md px-3 mt-1 text-xs"
              >
                <CirclePlus className="w-5 h-5 text-gray-400 hover:text-cyan-400" />
                New purchase
              </Link>
            </div>
          </div>

          {/* Inline quick filters row (GET /purchases) */}
          <form
            action="/purchases"
            method="GET"
            className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 items-end"
          >
            {/* Status */}
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-700">Status</span>
              <select
                name="status"
                defaultValue={params.status ?? ""}
                className="border bg-white border-gray-300 p-2 rounded text-sm font-mono"
              >
                <option value="">(Any)</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>

            {/* supplier (exact match) */}
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-700">supplier</span>
              <input
                type="text"
                name="supplier"
                defaultValue={params.supplier ?? ""}
                placeholder="Exact name"
                className="border bg-white border-gray-300 p-2 rounded text-sm font-mono"
              />
            </label>

            {/* Date range quick preset */}
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-700">Date Range</span>
              <select
                name="dateRange"
                defaultValue={params.dateRange ?? ""}
                className="border bg-white border-gray-300 p-2 rounded text-sm font-mono"
              >
                <option value="">(Custom)</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
            </label>

            {/* From / To */}
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-700">From</span>
              <input
                type="date"
                name="fromDate"
                defaultValue={params.fromDate ?? ""}
                className="border bg-white border-gray-300 p-2 rounded text-sm font-mono"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-700">To</span>
              <input
                type="date"
                name="toDate"
                defaultValue={params.toDate ?? ""}
                className="border bg-white border-gray-300 p-2 rounded text-sm font-mono"
              />
            </label>

            {/* Month shortcut */}
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-700">Month</span>
              <select
                name="month"
                defaultValue={params.month ?? ""}
                className="border bg-white border-gray-300 p-2 rounded text-sm font-mono"
              >
                <option value="">(None)</option>
                <option value="Jan">Jan</option>
                <option value="Feb">Feb</option>
                <option value="Mar">Mar</option>
                <option value="Apr">Apr</option>
                <option value="May">May</option>
                <option value="Jun">Jun</option>
                <option value="Jul">Jul</option>
                <option value="Aug">Aug</option>
                <option value="Sep">Sep</option>
                <option value="Oct">Oct</option>
                <option value="Nov">Nov</option>
                <option value="Dec">Dec</option>
              </select>
            </label>

            {/* Reset page on apply */}
            <input type="hidden" name="page" value="1" />

            <button
              type="submit"
              className="h-[38px] bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded font-mono text-sm"
            >
              Apply Filters
            </button>
          </form>
        </div>
      </div>

      <br />

      {/* Banners */}
      {params.added === "true" && (
        <div className="mb-4 mt-2 bg-green-100 text-green-800 px-4 py-2 rounded w-[90%] mx-auto">
          ✅ purchase added successfully!
        </div>
      )}
      {params.update === "true" && (
        <div className="mb-4 mt-2 bg-green-100 text-green-800 px-4 py-2 rounded w-[90%] mx-auto">
          ✅ purchase updated successfully!
        </div>
      )}
      {params.delete === "true" && (
        <div className="mb-4 mt-2 bg-red-100 text-red-800 px-4 py-2 rounded w-[90%] mx-auto">
          🗑️ purchase deleted successfully! Cannot be retrieved!!
        </div>
      )}

      {/* Table container */}
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 overflow-x-auto p-6 pb-24">
          <table className="table-auto border-collapse border border-gray-300 w-[90%] text-sm font-mono mx-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                  ID <span className="text-gray-400 text-xs">int4</span>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                  Invoice <span className="text-gray-400 text-xs">text</span>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                  Date <span className="text-gray-400 text-xs">timestamp</span>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                  supplier <span className="text-gray-400 text-xs">text</span>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                  Total <span className="text-gray-400 text-xs">numeric</span>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                  Status <span className="text-gray-400 text-xs">text</span>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {purchases.length === 0 ? (
                <tr>
                  <td
                    className="border border-gray-300 px-4 py-2 text-gray-600 italic"
                    colSpan={7}
                  >
                    No purchases found for the selected filters.
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                  >
                    <td className="border border-gray-300 px-4 py-2">
                      {purchase.id}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {purchase.poNumber}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(purchase.createdAt).toISOString().slice(0, 10)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {purchase.supplier?.name ?? ""}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {formatMoney(purchase.total, purchase.currency)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {purchase.status === "Pending" && (
                        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                          Pending
                        </span>
                      )}
                      {purchase.status === "Paid" && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                          Paid
                        </span>
                      )}
                      {purchase.status === "Cancelled" && (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 w-40 text-centre">
                      <div className="flex justify-evenly space-x-2">
                        {/* Edit */}
                        <Link
                          href={`/purchases/update/${purchase.id}`}
                          className="inline-flex items-center text-blue-400 hover:bg-blue-100 hover:text-blue-800 p-1 rounded transition relative group"
                        >
                          <Pencil className="w-5 h-5" />
                          <span className="absolute bottom-full ml-6 mt-2 left-full transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                            Edit
                          </span>
                        </Link>

                        {/* Invoice (view items) */}
                        <Link
                          href={`/purchaseitems/${purchase.id}`}
                          className="inline-flex items-center text-cyan-400 hover:bg-cyan-50 hover:text-cyan-800 p-1 rounded transition relative group"
                        >
                          <ReceiptText className="w-5 h-5" />
                          <span className="absolute bottom-full ml-6 mt-2 left-full transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                            Invoice
                          </span>
                        </Link>

                        {/* Delete */}

                        {isAdmin && (
                          <form action={deletePurchase} className="inline">
                            <input
                              type="hidden"
                              name="id"
                              value={purchase.id}
                            />
                            <button
                              type="submit"
                              className="cursor-pointer inline-flex items-center text-gray-400 hover:bg-red-50 hover:text-red-800 p-1 rounded transition relative group"
                            >
                              <Trash2 className="w-5 h-5" />
                              <span className="absolute bottom-full ml-6 mt-2 left-full transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                                Delete
                              </span>
                            </button>
                          </form>
                        )}

                        {/* <form action={deletepurchase} className="inline">
                          <input type="hidden" name="id" value={purchase.id} />
                          <button
                            type="submit"
                            className="cursor-pointer inline-flex items-center text-gray-400 hover:bg-red-50 hover:text-red-800 p-1 rounded transition relative group"
                          >
                            <Trash2 className="w-5 h-5" />
                            <span className="absolute bottom-full ml-6 mt-2 left-full transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                              Delete
                            </span>
                          </button>
                        </form> */}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="w-[90%] mx-auto">
        <PaginationClient currentPage={page} totalPages={totalPages} />
      </div>
    </div>
  );
}
