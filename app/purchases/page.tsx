// app/purchases/page.tsx
import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { updatePurchaseStatus, deletePurchase } from "./purchase";

function formatMoney(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(Number.isFinite(n) ? n : 0);
  } catch {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number.isFinite(n) ? n : 0);
  }
}

function StatusPill({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700 border-green-300",
    posted: "bg-blue-100 text-blue-700 border-blue-300",
    pending: "bg-amber-100 text-amber-700 border-amber-300",
    cancelled: "bg-red-100 text-red-700 border-red-300",
  };
  const cls = map[s] || "bg-gray-100 text-gray-700 border-gray-300";
  return (
    <span className={`px-2 py-1 rounded border text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

export default async function PurchasesPage() {
  const { appUser } = await requireVerifiedUser();
  if (!appUser.currentOrganisationId) notFound();
  const orgId = appUser.currentOrganisationId!;

  // Load latest purchases for this org
  const purchases = await prisma.purchase.findMany({
    where: { organisationId: orgId },
    orderBy: [{ createdAt: "desc" }],
    include: {
      supplier: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
    },
    take: 100, // adjust if needed
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Purchases</h1>
          <p className="text-sm text-gray-600">List of all Purchase Orders</p>
        </div>
        <Link
          href="/purchases/add"
          className="px-3 py-2 rounded text-white bg-cyan-600 hover:bg-cyan-700"
        >
          + Add Purchase
        </Link>
      </div>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-700 text-xs uppercase tracking-wide">
              <th className="px-3 py-2 border-b">#</th>
              <th className="px-3 py-2 border-b">Supplier</th>
              <th className="px-3 py-2 border-b">Contact</th>
              <th className="px-3 py-2 border-b">Currency</th>
              <th className="px-3 py-2 border-b text-right">Subtotal</th>
              <th className="px-3 py-2 border-b text-right">Tax</th>
              <th className="px-3 py-2 border-b text-right">Total</th>
              <th className="px-3 py-2 border-b">Status</th>
              <th className="px-3 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                  No purchases found. Create your first Purchase Order.
                </td>
              </tr>
            ) : (
              purchases.map((p) => (
                <tr key={p.id} className="text-sm">
                  <td className="px-3 py-2 border-b text-gray-600 font-mono">
                    {p.id}
                  </td>
                  <td className="px-3 py-2 border-b">
                    <div className="font-medium">{p.supplier?.name ?? "—"}</div>
                    {p.billNumber && (
                      <div className="text-xs text-gray-500">
                        Bill#: {p.billNumber}
                      </div>
                    )}
                    {p.reference && (
                      <div className="text-xs text-gray-500">
                        Ref: {p.reference}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 border-b">
                    {p.contact?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2 border-b">{p.currency}</td>
                  <td className="px-3 py-2 border-b text-right font-mono">
                    {formatMoney(Number(p.subtotal), p.currency)}
                  </td>
                  <td className="px-3 py-2 border-b text-right font-mono">
                    {formatMoney(Number(p.totalTaxAmount), p.currency)}
                  </td>
                  <td className="px-3 py-2 border-b text-right font-mono">
                    {formatMoney(Number(p.total), p.currency)}
                  </td>
                  <td className="px-3 py-2 border-b">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="px-3 py-2 border-b">
                    <div className="flex flex-wrap gap-2 items-center">
                      <Link
                        href={`/purchaseitems/${p.id}`}
                        className="px-2 py-1 rounded border bg-white text-cyan-700 hover:bg-cyan-50"
                        title="View Purchase Order"
                      >
                        View PO
                      </Link>

                      {/* Quick status update */}
                      <form
                        action={updatePurchaseStatus}
                        className="flex gap-1"
                      >
                        <input
                          type="hidden"
                          name="purchaseId"
                          value={String(p.id)}
                        />
                        <select
                          name="status"
                          defaultValue={p.status}
                          className="border bg-white border-gray-300 px-2 py-1 rounded text-xs"
                          title="Change status"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Posted">Posted</option>
                          <option value="Paid">Paid</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <button
                          type="submit"
                          className="px-2 py-1 rounded text-xs text-white bg-gray-700 hover:bg-gray-800"
                          title="Update"
                        >
                          Update
                        </button>
                      </form>

                      {/* Delete (admin only; server enforces) */}
                      <form
                        action={deletePurchase}
                        onSubmit={(e) => {
                          if (!confirm("Delete this purchase?"))
                            e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="id" value={String(p.id)} />
                        <button
                          type="submit"
                          className="px-2 py-1 rounded text-xs text-white bg-red-600 hover:bg-red-700"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
