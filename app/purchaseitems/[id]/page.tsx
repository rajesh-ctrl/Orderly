// app/purchaseitems/[id]/page.tsx
import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import type { Metadata } from "next";
import InvoiceToolbar from "./InvoiceToolbar";

// ---------- Dynamic metadata to set the <title> for PDF filename ----------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const purchase = await prisma.purchase.findUnique({
    where: { id: Number(id) },
    select: {
      poNumber: true,
      supplier: { select: { name: true } },
    },
  });

  const po = purchase?.poNumber?.trim() || `Purchase Order-${id}`;
  const sup = purchase?.supplier?.name?.trim();
  const safeSup = sup ? sup.replace(/[<>:"/\\|?*]+/g, "_") : "Customer";

  return {
    title: `${po} - ${safeSup}`,
    description: `Purchase Order ${po} for ${safeSup}`,
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
  // numeric amount only (no currency symbol) for compact table cells
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}
const round2 = (n: number) => Math.round(n * 100) / 100;

function StatusPill({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  const map: Record<string, string> = {
    paid: "bg-green-100 text-green-700 bpurchase-green-300",
    pending: "bg-amber-100 text-amber-700 bpurchase-amber-300",
    cancelled: "bg-red-100 text-red-700 bpurchase-red-300",
  };
  const cls = map[s] || "bg-gray-100 text-gray-700 bpurchase-gray-300";
  return (
    <span
      className={`px-2 py-1 rounded bpurchase text-xs font-semibold ${cls}`}
    >
      {status}
    </span>
  );
}

// ---------- Server Component page ----------
export default async function InvoicePage({
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

  // Seller (Organisation)
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
  const taxInclusive = !!purchase.taxInclusive;

  // Tax components split (for inclusive mode)
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

  // Additional charges
  const addl = (purchase.additionalCharges as any) || null;
  const additionalChargeName = addl?.name || null;
  const additionalChargeAmount = Number(addl?.amount ?? 0);

  const grandTotal = round2(subtotal + totalTaxAmount + additionalChargeAmount);

  // ---------- Inline print CSS (compact) ----------
  const printCss = `
    @media print {
      /* A4; feel free to switch to Letter */
      @page { size: A4; margin: 10mm 8mm 10mm 8mm; } /* slightly reduced bottom */

      html, body { margin: 0 !important; padding: 0 !important; }
      .print-container { padding: 0 !important; max-width: 100% !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .print\\:hidden { display: none !important; }
      .shadow, .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl { box-shadow: none !important; }
      .rounded, .rounded-md, .rounded-lg { bpurchase-radius: 0 !important; }
      .print-no-overflow { overflow: visible !important; }

      /* Table pagination helpers */
      table { page-break-inside: auto; bpurchase-collapse: collapse; width: 100%; }
      thead { display: table-header-group; }   /* header repeats per page */
      tr { page-break-inside: avoid; break-inside: avoid; }
      td, th { break-inside: avoid; page-break-inside: avoid; }

      /* Compact cells */
      .table-cell-compact td, .table-cell-compact th { padding: 5px 7px !important; }

      /* Totals & signature band stays together */
      .totals-block { page-break-inside: avoid; break-inside: avoid; }
    }
  `;

  return (
    <div className="max-w-5xl mx-auto p-6 print-container">
      {/* Inline print styles */}
      <style dangerouslySetInnerHTML={{ __html: printCss }} />

      {/* Toolbar (client) */}
      <div className="mb-4 print:hidden">
        <InvoiceToolbar
          poNumber={purchase.poNumber}
          supplierName={purchase.supplier?.name ?? null}
          relativeUrl={`/purchaseitems/${purchase.id}`}
          supplierEmail={purchase.supplier?.email ?? undefined}
          supplierPhone={purchase.supplier?.contactNumber ?? undefined}
          orgName={organisation?.name ?? undefined}
        />
      </div>

      {/* Purchase Order Card */}
      <div className="bg-white shadow rounded bpurchase bpurchase-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bpurchase-b flex items-start justify-between gap-4 bg-linear-to-r from-cyan-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-cyan-500 text-white flex items-center justify-center font-bold text-lg">
              PO
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Purchase Order
              </h1>
              <div className="text-sm text-gray-600">
                Purchase Order No:{" "}
                <span className="font-mono">{purchase.poNumber}</span>
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
            <StatusPill status={purchase.status} />
            <div className="mt-2 text-xs text-gray-600">
              Tax Mode:{" "}
              <b>{taxInclusive ? "Inclusive" : "Exclusive (no tax applied)"}</b>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* From */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              PO From:
            </h3>
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

          {/* Bill To + inlined Contact Person */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">PO To:</h3>
            <div className="text-sm leading-tight">
              <div className="font-medium">
                {purchase.supplier?.name || "Customer"}
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

              {/* Contact Person inline & compact */}
              {purchase.contact && (
                <div className="mt-2 text-[12px] text-gray-700 leading-tight">
                  <span className="font-semibold">Contact:</span>{" "}
                  <span>{purchase.contact?.name}</span>
                  {purchase.contact?.email && (
                    <>
                      {" "}
                      <span className="text-gray-400">•</span>{" "}
                      <span className="text-gray-600">
                        {purchase.contact?.email}
                      </span>
                    </>
                  )}
                  {purchase.contact?.contactNumber && (
                    <>
                      {" "}
                      <span className="text-gray-400">•</span>{" "}
                      <span className="text-gray-600">
                        {purchase.contact?.contactNumber}
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
          <div className="overflow-x-auto rounded bpurchase print-no-overflow">
            <table className="min-w-full bpurchase-collapse table-cell-compact">
              <thead className="bg-gray-50 text-[11px] leading-tight">
                <tr className="text-left text-gray-700 uppercase tracking-wide">
                  <th className="px-2.5 py-1.5 bpurchase-b">#</th>
                  <th className="px-2.5 py-1.5 bpurchase-b">Item</th>
                  <th className="px-2.5 py-1.5 bpurchase-b">SKU</th>
                  <th className="px-2.5 py-1.5 bpurchase-b">HSN</th>
                  <th className="px-2.5 py-1.5 bpurchase-b text-right">Qty</th>
                  <th className="px-2.5 py-1.5 bpurchase-b text-right">
                    Unit Price
                  </th>
                  <th className="px-2.5 py-1.5 bpurchase-b text-right">
                    Tax %
                  </th>
                  <th className="px-2.5 py-1.5 bpurchase-b text-right">
                    Tax Amt
                  </th>
                  <th className="px-2.5 py-1.5 bpurchase-b text-right">
                    Line Total (excl. Tax)
                  </th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((it, idx) => {
                  const qty = Number(it.quantity);
                  const unitCatalog = Number(it.unitPrice); // catalog snapshot
                  const unitCharged = Number(it.actualprice); // charged per-unit EXCL tax
                  const taxPct = Number(it.taxRatePct);
                  const lineTax = Number(it.lineTaxAmount);
                  const lineTotalExcl = Number(it.lineTotal) - lineTax; // excl. tax

                  // let discountLabel: string | null = null;
                  // let isMarkup = false;
                  // if (Number.isFinite(unitCatalog) && unitCatalog > 0) {
                  //   const pct = round2(
                  //     ((unitCatalog - unitCharged) / unitCatalog) * 100
                  //   );
                  //   if (pct > 0) {
                  //     discountLabel = `Disc ${pct.toFixed(2)}%`;
                  //   } else if (pct < 0) {
                  //     discountLabel = `Markup ${Math.abs(pct).toFixed(2)}%`;
                  //     isMarkup = true; // hide catalog & markup line
                  //   }
                  // }

                  return (
                    <tr key={it.id} className="text-sm">
                      <td className="px-2.5 py-1.5 bpurchase-b text-gray-600">
                        {idx + 1}
                      </td>
                      <td className="px-2.5 py-1.5 bpurchase-b">
                        <div className="font-medium text-gray-900">
                          {it.productname}
                        </div>
                        {/* {!isMarkup && (
                          <div className="text-xs text-gray-500">
                            Catalog: {formatAmount(unitCatalog)}
                            {discountLabel &&
                            discountLabel.startsWith("Disc") ? (
                              <> · {discountLabel}</>
                            ) : null}
                          </div>
                        )} */}
                      </td>
                      <td className="px-2.5 py-1.5 bpurchase-b text-gray-700">
                        {it.sku}
                      </td>
                      <td className="px-2.5 py-1.5 bpurchase-b text-gray-700">
                        {it.HSN}
                      </td>
                      <td className="px-2.5 py-1.5 bpurchase-b text-right font-mono">
                        {qty}
                      </td>
                      <td className="px-2.5 py-1.5 bpurchase-b text-right font-mono">
                        {formatAmount(unitCharged)}
                      </td>
                      <td className="px-2.5 py-1.5 bpurchase-b text-right font-mono">
                        {taxInclusive ? taxPct.toFixed(2) : "—"}
                      </td>
                      <td className="px-2.5 py-1.5 bpurchase-b text-right font-mono">
                        {taxInclusive ? formatAmount(lineTax) : "—"}
                      </td>
                      <td className="px-2.5 py-1.5 bpurchase-b text-right font-mono">
                        {formatAmount(lineTotalExcl)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals band: 2 columns on md+ => Left: Seller signature | Right: Totals stack */}
          <div className="mt-5 totals-block">
            <div className=" grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LEFT: Seller signature compact */}
              <div className="flex items-end md:items-start md:justify-start justify-end">
                <div className=" mt-5 text-xs text-gray-600">
                  <div className="h-14 bpurchase-b w-56"></div>
                  <div className="mt-1">
                    Purchased by, <br /> {organisation?.name || "Organisation"}
                  </div>
                </div>
              </div>

              {/* RIGHT: Totals compact stack */}
              <div className="bpurchase rounded p-2">
                <div className="flex flex-col items-end gap-1">
                  {/* Subtotal */}
                  <div className="flex items-baseline gap-2">
                    <div className="text-sm text-gray-700">Subtotal</div>
                    <div className="font-semibold font-mono text-right w-44">
                      {formatMoney(subtotal, currency)}
                    </div>
                  </div>

                  {/* Tax components — compact per-line */}
                  {taxInclusive && taxComponentRows.length > 0 && (
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
                    <div className="text-sm text-gray-700">
                      {taxInclusive ? "Total Tax" : "Tax"}
                    </div>
                    <div className="font-semibold font-mono text-right w-44">
                      {taxInclusive
                        ? formatMoney(totalTaxAmount, currency)
                        : formatMoney(0, currency)}
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

            {/* (NOTE: Removed the computer-generated line to save space) */}
          </div>
        </div>
      </div>

      {/* Print dialog tips:
         - Destination: Save as PDF
         - Margins: None (or Default)
         - Uncheck "Headers and footers"
         - Paper size: A4 or Letter to match @page size
      */}
    </div>
  );
}
