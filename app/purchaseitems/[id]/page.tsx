// app/purchaseitems/[id]/page.tsx
import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import InvoiceToolbar from "../toolbar"; // client component for Print/Copy link

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
const round2 = (n: number) => Math.round(n * 100) / 100;

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

export default async function PurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;

  const { appUser } = await requireVerifiedUser();
  if (!appUser.currentOrganisationId) notFound();
  const orgId = appUser.currentOrganisationId!;

  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: {
      items: { orderBy: { id: "asc" } },
      supplier: {
        select: {
          id: true,
          name: true,
          email: true,
          contactNumber: true,
          taxNumber: true,
          address1: true,
          address2: true,
          state: true,
          country: true,
          zipcode: true,
        },
      },
      contact: {
        select: {
          id: true,
          name: true,
          email: true,
          contactNumber: true,
        },
      },
    },
  });

  if (!purchase) notFound();
  if (purchase.organisationId !== orgId) notFound();

  // Organisation (seller)
  const organisation = await prisma.organisation.findUnique({
    where: { id: purchase.organisationId },
    select: {
      name: true,
      address1: true,
      address2: true,
      state: true,
      zipcode: true,
      country: true,
      taxNumber: true,
    },
  });

  const currency = purchase.currency || "INR";
  const createdOn = new Date(purchase.createdAt);

  const subtotal = Number(purchase.subtotal);
  const totalTaxAmount = Number(purchase.totalTaxAmount);
  const taxInclusive =
    !!purchase.taxBreakdownJson &&
    Array.isArray(purchase.taxBreakdownJson) &&
    totalTaxAmount > 0;

  const components: { name: string; percentage: number }[] = Array.isArray(
    purchase.taxBreakdownJson
  )
    ? (purchase.taxBreakdownJson as any[])
    : [];

  const taxComponentRows =
    taxInclusive && totalTaxAmount > 0 && components.length > 0
      ? components.map((c) => ({
          name: c?.name || "Tax",
          percentage: Number(c?.percentage ?? 0),
          amount: round2(totalTaxAmount * Number(c?.percentage ?? 0) * 0.01),
        }))
      : [];

  const addl = (purchase.additionalCharges as any) || null;
  const additionalChargeName = addl?.name || null;
  const additionalChargeAmount = Number(addl?.amount ?? 0);

  const grandTotal = round2(subtotal + totalTaxAmount + additionalChargeAmount);

  // Strong print CSS to minimize margins
  const printCss = `
    @media print {
      @page { size: A4; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; }
      .print-container { padding: 0 !important; max-width: 100% !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .print\\:hidden { display: none !important; }
      .shadow, .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl { box-shadow: none !important; }
      .rounded, .rounded-md, .rounded-lg { border-radius: 0 !important; }
      .print-no-overflow { overflow: visible !important; }
      table { page-break-inside: auto; border-collapse: collapse; width: 100%; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      tr { page-break-inside: avoid; break-inside: avoid; }
      td, th { break-inside: avoid; page-break-inside: avoid; }
      .table-cell-compact td, .table-cell-compact th { padding: 6px 8px !important; }
      .totals-block { page-break-inside: avoid; break-inside: avoid; }
      .signature-block { page-break-inside: avoid; break-inside: avoid; }
    }
  `;

  return (
    <div className="max-w-5xl mx-auto p-6 print-container">
      <style dangerouslySetInnerHTML={{ __html: printCss }} />
      <div className="mb-4 print:hidden">
        <InvoiceToolbar />
      </div>

      <div className="bg-white shadow rounded border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-start justify-between gap-4 bg-gradient-to-r from-cyan-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-cyan-500 text-white flex items-center justify-center font-bold text-lg">
              PO
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Purchase Order
              </h1>
              {purchase.billNumber && (
                <div className="text-sm text-gray-600">
                  Supplier Bill No:{" "}
                  <span className="font-mono">{purchase.billNumber}</span>
                </div>
              )}
              {purchase.reference && (
                <div className="text-sm text-gray-600">
                  Reference:{" "}
                  <span className="font-mono">{purchase.reference}</span>
                </div>
              )}
              <div className="text-sm text-gray-600">
                Date:{" "}
                <span className="font-mono">
                  {createdOn.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <StatusPill status={purchase.status} />
          </div>
        </div>

        {/* Parties: Organisation & Supplier */}
        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              From (Organisation)
            </h3>
            <div className="text-sm">
              <div className="font-medium">
                {organisation?.name || "Organisation"}
              </div>
              {organisation?.taxNumber && (
                <div className="text-gray-600">
                  Tax No: {organisation?.taxNumber}
                </div>
              )}
              {(organisation?.address1 || organisation?.address2) && (
                <div className="text-gray-700">
                  {organisation?.address1}
                  {organisation?.address2 ? `, ${organisation?.address2}` : ""}
                  <br />
                  {[
                    organisation?.state,
                    organisation?.zipcode,
                    organisation?.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Supplier
            </h3>
            <div className="text-sm">
              <div className="font-medium">
                {purchase.supplier?.name || "Supplier"}
              </div>
              {purchase.supplier?.taxNumber && (
                <div className="text-gray-600">
                  Tax No: {purchase.supplier?.taxNumber}
                </div>
              )}
              {(purchase.supplier?.address1 || purchase.supplier?.address2) && (
                <div className="text-gray-700">
                  {purchase.supplier?.address1}
                  {purchase.supplier?.address2
                    ? `, ${purchase.supplier?.address2}`
                    : ""}
                  <br />
                  {[
                    purchase.supplier?.state,
                    purchase.supplier?.zipcode,
                    purchase.supplier?.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}
              {(purchase.supplier?.email ||
                purchase.supplier?.contactNumber) && (
                <div className="text-gray-600 mt-1">
                  {purchase.supplier?.email && (
                    <div>{purchase.supplier?.email}</div>
                  )}
                  {purchase.supplier?.contactNumber && (
                    <div>{purchase.supplier?.contactNumber}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact person */}
        <div className="px-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Supplier Contact
          </h3>
          {purchase.contact ? (
            <div className="text-sm">
              <div className="font-medium">{purchase.contact?.name}</div>
              {(purchase.contact?.email || purchase.contact?.contactNumber) && (
                <div className="text-gray-600 mt-1">
                  {purchase.contact?.email && (
                    <div>{purchase.contact?.email}</div>
                  )}
                  {purchase.contact?.contactNumber && (
                    <div>{purchase.contact?.contactNumber}</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">—</div>
          )}
        </div>

        {/* Items table */}
        <div className="px-6 pb-6 mt-4">
          <div className="overflow-x-auto rounded border print-no-overflow">
            <table className="min-w-full border-collapse table-cell-compact">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-700 text-xs uppercase tracking-wide">
                  <th className="px-3 py-2 border-b">#</th>
                  <th className="px-3 py-2 border-b">Item</th>
                  <th className="px-3 py-2 border-b">SKU</th>
                  <th className="px-3 py-2 border-b">HSN</th>
                  <th className="px-3 py-2 border-b text-right">Qty</th>
                  <th className="px-3 py-2 border-b text-right">Unit Price</th>
                  <th className="px-3 py-2 border-b text-right">Tax %</th>
                  <th className="px-3 py-2 border-b text-right">Tax Amt</th>
                  <th className="px-3 py-2 border-b text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((it, idx) => {
                  const qty = Number(it.quantity);
                  const unit = Number(it.unitPrice); // purchase per-unit EXCL tax
                  const taxPct = Number(it.taxRatePct);
                  const lineTax = Number(it.lineTaxAmount);
                  const lineTotal = Number(it.lineTotal);
                  return (
                    <tr key={it.id} className="text-sm">
                      <td className="px-3 py-2 border-b text-gray-600">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2 border-b">
                        <div className="font-medium text-gray-900">
                          {it.productname}
                        </div>
                      </td>
                      <td className="px-3 py-2 border-b text-gray-700">
                        {it.sku ?? ""}
                      </td>
                      <td className="px-3 py-2 border-b text-gray-700">
                        {it.HSN ?? ""}
                      </td>
                      <td className="px-3 py-2 border-b text-right font-mono">
                        {qty}
                      </td>
                      <td className="px-3 py-2 border-b text-right font-mono">
                        {formatMoney(unit, currency)}
                      </td>
                      <td className="px-3 py-2 border-b text-right font-mono">
                        {taxInclusive ? taxPct.toFixed(2) : "—"}
                      </td>
                      <td className="px-3 py-2 border-b text-right font-mono">
                        {taxInclusive ? formatMoney(lineTax, currency) : "—"}
                      </td>
                      <td className="px-3 py-2 border-b text-right font-mono">
                        {formatMoney(lineTotal, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="totals-block">
                {/* Subtotal */}
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-2 text-right text-sm text-gray-700"
                  >
                    Subtotal
                  </td>
                  <td
                    colSpan={2}
                    className="px-3 py-2 text-right font-semibold font-mono"
                  >
                    {formatMoney(subtotal, currency)}
                  </td>
                </tr>

                {/* Tax breakdown */}
                {taxInclusive && taxComponentRows.length > 0 ? (
                  <>
                    <tr>
                      <td
                        colSpan={9}
                        className="px-3 pt-4 text-right text-xs text-gray-500"
                      >
                        Tax Components
                      </td>
                    </tr>
                    {taxComponentRows.map((row, i) => (
                      <tr key={`taxc-${i}`}>
                        <td
                          colSpan={7}
                          className="px-3 py-1 text-right text-sm text-gray-700"
                        >
                          {row.name} ({row.percentage.toFixed(2)}%)
                        </td>
                        <td
                          colSpan={2}
                          className="px-3 py-1 text-right font-mono"
                        >
                          {formatMoney(row.amount, currency)}
                        </td>
                      </tr>
                    ))}
                  </>
                ) : null}

                {/* Total Tax */}
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-2 text-right text-sm text-gray-700"
                  >
                    {taxInclusive ? "Total Tax" : "Tax"}
                  </td>
                  <td
                    colSpan={2}
                    className="px-3 py-2 text-right font-semibold font-mono"
                  >
                    {taxInclusive
                      ? formatMoney(totalTaxAmount, currency)
                      : formatMoney(0, currency)}
                  </td>
                </tr>

                {/* Additional charges */}
                {additionalChargeName && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-2 text-right text-sm text-gray-700"
                    >
                      {additionalChargeName}
                    </td>
                    <td
                      colSpan={2}
                      className="px-3 py-2 text-right font-semibold font-mono"
                    >
                      {formatMoney(additionalChargeAmount, currency)}
                    </td>
                  </tr>
                )}

                {/* Grand Total */}
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-3 text-right text-base font-bold"
                  >
                    Grand Total
                  </td>
                  <td
                    colSpan={2}
                    className="px-3 py-3 text-right font-extrabold font-mono text-lg"
                  >
                    {formatMoney(grandTotal, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes (if any) */}
          {purchase.notes && (
            <div className="mt-6 text-xs text-gray-600">
              <div className="font-semibold text-gray-700">Notes</div>
              <p className="mt-1">{purchase.notes}</p>
            </div>
          )}

          {/* Signature area */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 signature-block">
            <div className="text-xs text-gray-600">
              <div className="h-16 border-b w-60"></div>
              <div className="mt-2">Authorised Signature</div>
            </div>
            <div className="text-xs text-gray-600 md:text-right">
              <div className="h-16 border-b md:ml-auto w-60"></div>
              <div className="mt-2">Supplier Stamp & Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
