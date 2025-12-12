// app/purchases/[id]/page.tsx
import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import type { Metadata } from "next";

// ---------- Dynamic metadata for PDF filename ----------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const po = await prisma.purchase.findUnique({
    where: { id: Number(id) },
    select: {
      reference: true,
      supplier: { select: { name: true } },
    },
  });

  const poNo = po?.reference?.trim() || `PO-${id}`;
  const supp = po?.supplier?.name?.trim();
  const safeSupp = supp ? supp.replace(/[<>:"/\\|?*]+/g, "_") : "Supplier";

  return {
    title: `${poNo} - ${safeSupp}`,
    description: `Purchase Order ${poNo} for ${safeSupp}`,
  };
}

// ---------- Helpers ----------
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
function formatAmount(n: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
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

// ---------- Page ----------
export default async function PurchasePage({
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

  const po = await prisma.purchase.findUnique({
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

  if (!po) notFound();
  if (po.organisationId !== orgId) notFound();

  // Organisation (Buyer)
  const organisation = await prisma.organisation.findUnique({
    where: { id: po.organisationId },
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

  const currency = po.currency || "INR";
  const createdOn = new Date(po.createdAt);

  const subtotal = Number(po.subtotal);
  const totalTaxAmount = Number(po.totalTaxAmount);
  const components: { name: string; percentage: number }[] = Array.isArray(
    po.taxBreakdownJson
  )
    ? (po.taxBreakdownJson as any[])
    : [];

  const taxComponentRows =
    totalTaxAmount > 0 && components.length > 0
      ? components.map((c) => ({
          name: c?.name || "Tax",
          percentage: Number(c?.percentage ?? 0),
          amount: round2(totalTaxAmount * Number(c?.percentage ?? 0) * 0.01),
        }))
      : [];

  const addl = (po.additionalCharges as any) || null;
  const additionalChargeName = addl?.name || null;
  const additionalChargeAmount = Number(addl?.amount ?? 0);

  const grandTotal = round2(subtotal + totalTaxAmount + additionalChargeAmount);
  const poNo = po.reference?.trim() || po.billNumber?.trim() || `PO-${po.id}`;

  // ---------- Inline print CSS ----------
  const printCss = `
    @media print {
      @page { size: A4; margin: 10mm 8mm 10mm 8mm; }

      html, body { margin: 0 !important; padding: 0 !important; }
      .print-container { padding: 0 !important; max-width: 100% !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .print\\:hidden { display: none !important; }
      .shadow, .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl { box-shadow: none !important; }
      .rounded, .rounded-md, .rounded-lg { border-radius: 0 !important; }
      .print-no-overflow { overflow: visible !important; }

      table { page-break-inside: auto; border-collapse: collapse; width: 100%; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; break-inside: avoid; }
      td, th { break-inside: avoid; page-break-inside: avoid; }

      .table-cell-compact td, .table-cell-compact th { padding: 5px 7px !important; }
      .totals-block { page-break-inside: avoid; break-inside: avoid; }
    }
  `;

  return (
    <div className="max-w-5xl mx-auto p-6 print-container">
      <style dangerouslySetInnerHTML={{ __html: printCss }} />

      {/* Toolbar: reuse your toolbar if needed */}
      <div className="mb-4 print:hidden">
        {/* You can add buttons that only open mail/whatsapp (no attachments) */}
      </div>

      {/* PO Card */}
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
              <div className="text-sm text-gray-600">
                PO No: <span className="font-mono">{poNo}</span>
              </div>
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
            <StatusPill status={po.status} />
          </div>
        </div>

        {/* Parties */}
        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buyer (Organisation) */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Buyer</h3>
            <div className="text-sm leading-tight">
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

          {/* Supplier + inlined Contact Person */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Supplier
            </h3>
            <div className="text-sm leading-tight">
              <div className="font-medium">
                {po.supplier?.name || "Supplier"}
              </div>
              {po.supplier?.taxNumber && (
                <div className="text-gray-600">
                  Tax No: {po.supplier?.taxNumber}
                </div>
              )}
              {(po.supplier?.address1 || po.supplier?.address2) && (
                <div className="text-gray-700">
                  {po.supplier?.address1}
                  {po.supplier?.address2 ? `, ${po.supplier?.address2}` : ""}
                  <br />
                  {[
                    po.supplier?.state,
                    po.supplier?.zipcode,
                    po.supplier?.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}
              {(po.supplier?.email || po.supplier?.contactNumber) && (
                <div className="text-gray-600 mt-1">
                  {po.supplier?.email && <div>{po.supplier?.email}</div>}
                  {po.supplier?.contactNumber && (
                    <div>{po.supplier?.contactNumber}</div>
                  )}
                </div>
              )}

              {/* Contact Person inline & compact */}
              {po.contact && (
                <div className="mt-2 text-[12px] text-gray-700 leading-tight">
                  <span className="font-semibold">Contact:</span>{" "}
                  <span>{po.contact?.name}</span>
                  {po.contact?.email && (
                    <>
                      {" "}
                      <span className="text-gray-400">•</span>{" "}
                      <span className="text-gray-600">{po.contact?.email}</span>
                    </>
                  )}
                  {po.contact?.contactNumber && (
                    <>
                      {" "}
                      <span className="text-gray-400">•</span>{" "}
                      <span className="text-gray-600">
                        {po.contact?.contactNumber}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items table (compact, no currency symbols in cells) */}
        <div className="px-6 pb-6">
          <div className="overflow-x-auto rounded border print-no-overflow">
            <table className="min-w-full border-collapse table-cell-compact">
              <thead className="bg-gray-50 text-[11px] leading-tight">
                <tr className="text-left text-gray-700 uppercase tracking-wide">
                  <th className="px-2.5 py-1.5 border-b">#</th>
                  <th className="px-2.5 py-1.5 border-b">Item</th>
                  <th className="px-2.5 py-1.5 border-b">SKU</th>
                  <th className="px-2.5 py-1.5 border-b">HSN</th>
                  <th className="px-2.5 py-1.5 border-b text-right">Qty</th>
                  <th className="px-2.5 py-1.5 border-b text-right">
                    Unit Price
                  </th>
                  <th className="px-2.5 py-1.5 border-b text-right">Tax %</th>
                  <th className="px-2.5 py-1.5 border-b text-right">Tax Amt</th>
                  <th className="px-2.5 py-1.5 border-b text-right">
                    Line Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {po.items.map((it, idx) => {
                  const qty = Number(it.quantity);
                  const unitCharged = Number(it.unitPrice); // purchases use unitPrice snapshot
                  const taxPct = Number(it.taxRatePct);
                  const lineTax = Number(it.lineTaxAmount);
                  const lineTotal = Number(it.lineTotal);
                  return (
                    <tr key={it.id} className="text-sm">
                      <td className="px-2.5 py-1.5 border-b text-gray-600">
                        {idx + 1}
                      </td>
                      <td className="px-2.5 py-1.5 border-b">
                        <div className="font-medium text-gray-900">
                          {it.productname}
                        </div>
                      </td>
                      <td className="px-2.5 py-1.5 border-b text-gray-700">
                        {it.sku || ""}
                      </td>
                      <td className="px-2.5 py-1.5 border-b text-gray-700">
                        {it.HSN || ""}
                      </td>
                      <td className="px-2.5 py-1.5 border-b text-right font-mono">
                        {qty}
                      </td>
                      <td className="px-2.5 py-1.5 border-b text-right font-mono">
                        {formatAmount(unitCharged)}
                      </td>
                      <td className="px-2.5 py-1.5 border-b text-right font-mono">
                        {taxPct.toFixed(2)}
                      </td>
                      <td className="px-2.5 py-1.5 border-b text-right font-mono">
                        {formatAmount(lineTax)}
                      </td>
                      <td className="px-2.5 py-1.5 border-b text-right font-mono">
                        {formatAmount(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals band: LEFT signature | RIGHT totals */}
          <div className="mt-5 totals-block">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LEFT: Seller signature compact (Buyer issuing) */}
              <div className="flex items-end md:items-start md:justify-start justify-end">
                <div className="text-xs text-gray-600">
                  <div className="h-14 border-b w-56"></div>
                  <div className="mt-1">
                    Sold by, {organisation?.name || "Organisation"}
                  </div>
                </div>
              </div>

              {/* RIGHT: Totals compact stack */}
              <div className="border rounded p-2">
                <div className="flex flex-col items-end gap-1">
                  {/* Subtotal */}
                  <div className="flex items-baseline gap-2">
                    <div className="text-sm text-gray-700">Subtotal</div>
                    <div className="font-semibold font-mono text-right w-44">
                      {formatMoney(subtotal, currency)}
                    </div>
                  </div>

                  {/* Tax components — compact per-line */}
                  {taxComponentRows.length > 0 && (
                    <div className="w-full mt-1">
                      <div className="text-[11px] text-gray-500 text-right leading-tight -mb-0.5">
                        Tax Components
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1">
                        {taxComponentRows.map((row, i) => (
                          <React.Fragment key={`taxc-${i}`}>
                            <div className="text-right text-[12px] leading-tight text-gray-700">
                              {row.name} ({row.percentage.toFixed(2)}%)
                            </div>
                            <div className="text-right font-mono text-[12px] leading-tight">
                              {formatMoney(row.amount, currency)}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total Tax */}
                  <div className="flex items-baseline gap-2 mt-1">
                    <div className="text-sm text-gray-700">Total Tax</div>
                    <div className="font-semibold font-mono text-right w-44">
                      {formatMoney(totalTaxAmount, currency)}
                    </div>
                  </div>

                  {/* Additional charges */}
                  {additionalChargeName && (
                    <div className="flex items-baseline gap-2 mt-1">
                      <div className="text-sm text-gray-700">
                        {additionalChargeName}
                      </div>
                      <div className="font-semibold font-mono text-right w-44">
                        {formatMoney(additionalChargeAmount, currency)}
                      </div>
                    </div>
                  )}

                  {/* Grand Total */}
                  <div className="flex items-baseline gap-2 mt-2">
                    <div className="text-base font-bold">Grand Total</div>
                    <div className="font-extrabold font-mono text-right text-lg w-44">
                      {formatMoney(grandTotal, currency)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Note removed for space */}
          </div>
        </div>
      </div>
    </div>
  );
}
