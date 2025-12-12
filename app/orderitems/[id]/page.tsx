// import { prisma } from "@/lib/prisma";
// import PrintButton from "@/components/PrintButton";

// export default async function InvoicePage({
//   params,
// }: {
//   params: { id: string };
// }) {
//   const { id } = await params;
//   const orderId = Number(id);

//   const order = await prisma.order.findUnique({
//     where: { id: orderId },
//     include: {
//       items: { include: { product: true } },
//     },
//   });

//   if (!order) {
//     return <div className="p-6 text-red-600">Order not found.</div>;
//   }

//   const currentDate = new Date().toLocaleDateString("en-IN");
//   const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN");
//   const totalAmount = Math.round(
//     order.items.reduce(
//       (sum, item) => sum + item.unitPrice.toNumber() * item.quantity,
//       0
//     )
//   );

//   const formatCurrency = (amount: number) =>
//     new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: "INR",
//       minimumFractionDigits: 0,
//     }).format(amount);

//   return (
//     <div className="p-8 max-w-4xl mx-auto bg-white text-gray-900 font-mono print:p-4 print:max-w-full">
//       {/* Header */}
//       <div className="text-center mb-6">
//         <img
//           src="/logo.png"
//           alt="Company Logo"
//           className="mx-auto mb-2 w-24 h-24"
//         />
//         <h1 className="text-3xl font-bold">Invoice</h1>
//         <p className="text-sm text-gray-600">
//           Company Name Pvt Ltd | GSTIN: 1234567890 | Chennai, India
//         </p>
//       </div>

//       {/* Customer & Dates */}
//       <div className="flex justify-between mb-6 text-sm">
//         <div>
//           <p>
//             <strong>Sold To:</strong> {order.customerId}
//           </p>
//           <p>
//             <strong>Order Date:</strong> {orderDate}
//           </p>
//         </div>
//         <div className="text-right">
//           <p>
//             <strong>Invoice Date:</strong> {currentDate}
//           </p>
//           <p>
//             <strong>Invoice No:</strong> {order.invoiceNumber}
//           </p>
//         </div>
//       </div>

//       {/* Table */}
//       <div className="overflow-x-auto">
//         <table className="w-full border border-gray-300 text-sm">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="border px-3 py-2 text-left font-semibold">S.No</th>
//               <th className="border px-3 py-2 text-left font-semibold">
//                 Product Name
//               </th>
//               <th className="border px-3 py-2 text-right font-semibold">
//                 Unit Price
//               </th>
//               <th className="border px-3 py-2 text-right font-semibold">
//                 Quantity
//               </th>
//               <th className="border px-3 py-2 text-right font-semibold">
//                 Total Price
//               </th>
//             </tr>
//           </thead>
//           <tbody>
//             {order.items.map((item, index) => {
//               const unitPrice = item.unitPrice.toNumber();
//               return (
//                 <tr key={item.id} className="odd:bg-white even:bg-gray-50">
//                   <td className="border px-3 py-2">{index + 1}</td>
//                   <td className="border px-3 py-2">{item.product.name}</td>
//                   <td className="border px-3 py-2 text-right">
//                     {formatCurrency(unitPrice)}
//                   </td>
//                   <td className="border px-3 py-2 text-right">
//                     {item.quantity}
//                   </td>
//                   <td className="border px-3 py-2 text-right">
//                     {formatCurrency(Math.round(unitPrice * item.quantity))}.00
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* Totals Section */}
//       <div className="bg-gray-100 p-4 rounded mt-6 text-right space-y-2">
//         <p className="text-lg font-semibold">
//           Subtotal: {formatCurrency(totalAmount)}.00
//         </p>
//         <p className="text-sm">
//           CGST (9%): {formatCurrency(totalAmount * 0.09)}
//         </p>
//         <p className="text-sm">
//           SGST (9%): {formatCurrency(totalAmount * 0.09)}
//         </p>
//         <p className="text-xl font-bold">
//           Grand Total: {formatCurrency(Math.floor(totalAmount * 1.18))}
//         </p>
//       </div>

//       {/* Signature Section */}
//       <div className="flex justify-between mt-16 text-sm">
//         <div>
//           <p>
//             <strong>Authorized Signature:</strong>
//           </p>
//           <div className="border-t border-gray-400 mt-8 w-48"></div>
//         </div>
//         <div className="text-right italic text-gray-600">
//           <p>Thank you for your business!</p>
//         </div>
//       </div>

//       {/* Print Button */}
//       <div className="text-center mt-6 print:hidden">
//         <PrintButton />
//       </div>
//     </div>
//   );
// }

// app/orderitems/[id]/page.tsx

// // app/orderitems/[id]/page.tsx
// import React from "react";
// import { prisma } from "@/lib/prisma";
// import { notFound } from "next/navigation";
// import { requireVerifiedUser } from "@/lib/auth";
// import InvoiceToolbar from "./toolbar";

// function formatMoney(n: number, currency: string) {
//   try {
//     return new Intl.NumberFormat(undefined, {
//       style: "currency",
//       currency: currency || "INR",
//       maximumFractionDigits: 2,
//     }).format(Number.isFinite(n) ? n : 0);
//   } catch {
//     return new Intl.NumberFormat(undefined, {
//       style: "currency",
//       currency: "INR",
//       maximumFractionDigits: 2,
//     }).format(Number.isFinite(n) ? n : 0);
//   }
// }

// const round2 = (n: number) => Math.round(n * 100) / 100;

// function StatusPill({ status }: { status: string }) {
//   const s = (status || "").toLowerCase();
//   const map: Record<string, string> = {
//     paid: "bg-green-100 text-green-700 border-green-300",
//     pending: "bg-amber-100 text-amber-700 border-amber-300",
//     cancelled: "bg-red-100 text-red-700 border-red-300",
//   };
//   const cls = map[s] || "bg-gray-100 text-gray-700 border-gray-300";
//   return (
//     <span className={`px-2 py-1 rounded border text-xs font-semibold ${cls}`}>
//       {status}
//     </span>
//   );
// }

// export default async function InvoicePage({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const { id: idParam } = await params;

//   const { appUser } = await requireVerifiedUser();
//   if (!appUser.currentOrganisationId) notFound();
//   const orgId = appUser.currentOrganisationId!;

//   const id = Number(idParam);
//   if (!Number.isFinite(id) || id <= 0) notFound();

//   const order = await prisma.order.findUnique({
//     where: { id },
//     include: {
//       items: { orderBy: { id: "asc" } },
//       customer: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           contactNumber: true,
//           taxNumber: true,
//           address1: true,
//           address2: true,
//           state: true,
//           country: true,
//           zipcode: true,
//         },
//       },
//       contact: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           contactNumber: true,
//         },
//       },
//     },
//   });

//   if (!order) notFound();
//   if (order.organisationId !== orgId) notFound();

//   const organisation = await prisma.organisation.findUnique({
//     where: { id: order.organisationId },
//     select: {
//       name: true,
//       address1: true,
//       address2: true,
//       state: true,
//       zipcode: true,
//       country: true,
//       taxNumber: true,
//     },
//   });

//   const currency = order.currency || "INR";
//   const createdOn = new Date(order.createdAt);

//   const subtotal = Number(order.subtotal);
//   const totalTaxAmount = Number(order.totalTaxAmount);
//   const taxInclusive = !!order.taxInclusive;

//   const components: { name: string; percentage: number }[] = Array.isArray(
//     order.taxBreakdownJson
//   )
//     ? (order.taxBreakdownJson as any[])
//     : [];

//   const taxComponentRows =
//     taxInclusive && totalTaxAmount > 0 && components.length > 0
//       ? components.map((c) => ({
//           name: c?.name || "Tax",
//           percentage: Number(c?.percentage ?? 0),
//           amount: round2(totalTaxAmount * Number(c?.percentage ?? 0) * 0.01),
//         }))
//       : [];

//   const addl = (order.additionalCharges as any) || null;
//   const additionalChargeName = addl?.name || null;
//   const additionalChargeAmount = Number(addl?.amount ?? 0);

//   const grandTotal = round2(subtotal + totalTaxAmount + additionalChargeAmount);

//   // STRONG print CSS to minimize margins and fill the page
//   const printCss = `
//     @media print {
//       /* Use A4 -- change to Letter if needed */
//       @page {
//         size: A4;
//         margin: 0; /* remove page margins */
//       }

//       /* Remove default body margins/padding */
//       html, body {
//         margin: 0 !important;
//         padding: 0 !important;
//       }

//       /* Container: remove padding on print so content fills page width */
//       .print-container {
//         padding: 0 !important;
//         max-width: 100% !important; /* full page width */
//       }

//       /* Keep colors */
//       body {
//         -webkit-print-color-adjust: exact;
//         print-color-adjust: exact;
//       }

//       /* Hide toolbar */
//       .print\\:hidden { display: none !important; }

//       /* Remove shadows/rounded in print for crisp edges */
//       .shadow, .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl { box-shadow: none !important; }
//       .rounded, .rounded-md, .rounded-lg { border-radius: 0 !important; }

//       /* Avoid tables being clipped inside scroll wrappers */
//       .print-no-overflow { overflow: visible !important; }

//       /* Table pagination helpers */
//       table { page-break-inside: auto; border-collapse: collapse; width: 100%; }
//       thead { display: table-header-group; }   /* repeat header on each page */
//       tfoot { display: table-footer-group; }   /* keep totals grouped at the end */
//       tr { page-break-inside: avoid; break-inside: avoid; }
//       td, th { break-inside: avoid; page-break-inside: avoid; }

//       /* Compact table cells to fit more on page */
//       .table-cell-compact td, .table-cell-compact th { padding: 6px 8px !important; }

//       /* Keep totals/signature sections together */
//       .totals-block { page-break-inside: avoid; break-inside: avoid; }
//       .signature-block { page-break-inside: avoid; break-inside: avoid; }
//     }
//   `;

//   return (
//     <div className="max-w-5xl mx-auto p-6 print-container">
//       {/* Inline print styles */}
//       <style dangerouslySetInnerHTML={{ __html: printCss }} />

//       {/* Toolbar (client) */}
//       <div className="mb-4 print:hidden">
//         <InvoiceToolbar />
//       </div>

//       {/* Invoice Card */}
//       <div className="bg-white shadow rounded border border-gray-200 overflow-hidden">
//         {/* Header band */}
//         <div className="px-6 py-4 border-b flex items-start justify-between gap-4 bg-gradient-to-r from-cyan-50 to-white">
//           <div className="flex items-center gap-3">
//             <div className="w-12 h-12 rounded bg-cyan-500 text-white flex items-center justify-center font-bold text-lg">
//               INV
//             </div>
//             <div>
//               <h1 className="text-2xl font-bold tracking-tight">Invoice</h1>
//               <div className="text-sm text-gray-600">
//                 Invoice No:{" "}
//                 <span className="font-mono">{order.invoiceNumber}</span>
//               </div>
//               <div className="text-sm text-gray-600">
//                 Date:{" "}
//                 <span className="font-mono">
//                   {createdOn.toLocaleDateString(undefined, {
//                     year: "numeric",
//                     month: "short",
//                     day: "2-digit",
//                   })}
//                 </span>
//               </div>
//             </div>
//           </div>
//           <div className="text-right">
//             <StatusPill status={order.status} />
//             <div className="mt-2 text-xs text-gray-600">
//               Tax Mode:{" "}
//               <b>{taxInclusive ? "Inclusive" : "Exclusive (no tax applied)"}</b>
//             </div>
//           </div>
//         </div>

//         {/* Parties: Seller (Organisation) & Bill To (Customer) */}
//         <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <h3 className="text-sm font-semibold text-gray-700 mb-2">From</h3>
//             <div className="text-sm">
//               <div className="font-medium">
//                 {organisation?.name || "Organisation"}
//               </div>
//               {organisation?.taxNumber && (
//                 <div className="text-gray-600">
//                   Tax No: {organisation?.taxNumber}
//                 </div>
//               )}
//               {(organisation?.address1 || organisation?.address2) && (
//                 <div className="text-gray-700">
//                   {organisation?.address1}
//                   {organisation?.address2 ? `, ${organisation?.address2}` : ""}
//                   <br />
//                   {[
//                     organisation?.state,
//                     organisation?.zipcode,
//                     organisation?.country,
//                   ]
//                     .filter(Boolean)
//                     .join(", ")}
//                 </div>
//               )}
//             </div>
//           </div>

//           <div>
//             <h3 className="text-sm font-semibold text-gray-700 mb-2">
//               Bill To
//             </h3>
//             <div className="text-sm">
//               <div className="font-medium">
//                 {order.customer?.name || "Customer"}
//               </div>
//               {order.customer?.taxNumber && (
//                 <div className="text-gray-600">
//                   Tax No: {order.customer?.taxNumber}
//                 </div>
//               )}
//               {(order.customer?.address1 || order.customer?.address2) && (
//                 <div className="text-gray-700">
//                   {order.customer?.address1}
//                   {order.customer?.address2
//                     ? `, ${order.customer?.address2}`
//                     : ""}
//                   <br />
//                   {[
//                     order.customer?.state,
//                     order.customer?.zipcode,
//                     order.customer?.country,
//                   ]
//                     .filter(Boolean)
//                     .join(", ")}
//                 </div>
//               )}
//               {(order.customer?.email || order.customer?.contactNumber) && (
//                 <div className="text-gray-600 mt-1">
//                   {order.customer?.email && <div>{order.customer?.email}</div>}
//                   {order.customer?.contactNumber && (
//                     <div>{order.customer?.contactNumber}</div>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Contact person */}
//         <div className="px-6">
//           <h3 className="text-sm font-semibold text-gray-700 mb-2">
//             Contact Person
//           </h3>
//           {order.contact ? (
//             <div className="text-sm">
//               <div className="font-medium">{order.contact?.name}</div>
//               {(order.contact?.email || order.contact?.contactNumber) && (
//                 <div className="text-gray-600 mt-1">
//                   {order.contact?.email && <div>{order.contact?.email}</div>}
//                   {order.contact?.contactNumber && (
//                     <div>{order.contact?.contactNumber}</div>
//                   )}
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div className="text-sm text-gray-500">—</div>
//           )}
//         </div>

//         {/* Items table */}
//         <div className="px-6 pb-6 mt-4">
//           <div className="overflow-x-auto rounded border print-no-overflow">
//             <table className="min-w-full border-collapse table-cell-compact">
//               <thead className="bg-gray-50">
//                 <tr className="text-left text-gray-700 text-xs uppercase tracking-wide">
//                   <th className="px-3 py-2 border-b">#</th>
//                   <th className="px-3 py-2 border-b">Item</th>
//                   <th className="px-3 py-2 border-b">SKU</th>
//                   <th className="px-3 py-2 border-b">HSN</th>
//                   <th className="px-3 py-2 border-b text-right">Qty</th>
//                   <th className="px-3 py-2 border-b text-right">Unit Price</th>
//                   <th className="px-3 py-2 border-b text-right">Tax %</th>
//                   <th className="px-3 py-2 border-b text-right">Tax Amt</th>
//                   <th className="px-3 py-2 border-b text-right">
//                     Line Total (excl. Tax)
//                   </th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {order.items.map((it, idx) => {
//                   const qty = Number(it.quantity);
//                   const unit = Number(it.actualprice); // charged per-unit EXCL tax
//                   const taxPct = Number(it.taxRatePct);
//                   const lineTax = Number(it.lineTaxAmount);
//                   const lineTotal = Number(it.lineTotal) - lineTax;
//                   return (
//                     <tr key={it.id} className="text-sm">
//                       <td className="px-3 py-2 border-b text-gray-600">
//                         {idx + 1}
//                       </td>
//                       <td className="px-3 py-2 border-b">
//                         <div className="font-medium text-gray-900">
//                           {it.productname}
//                         </div>
//                         <div className="text-xs text-gray-500">
//                           Catalog: {formatMoney(Number(it.unitPrice), currency)}
//                         </div>
//                       </td>
//                       <td className="px-3 py-2 border-b text-gray-700">
//                         {it.sku}
//                       </td>
//                       <td className="px-3 py-2 border-b text-gray-700">
//                         {it.HSN}
//                       </td>
//                       <td className="px-3 py-2 border-b text-right font-mono">
//                         {qty}
//                       </td>
//                       <td className="px-3 py-2 border-b text-right font-mono">
//                         {formatMoney(unit, currency)}
//                       </td>
//                       <td className="px-3 py-2 border-b text-right font-mono">
//                         {taxInclusive ? taxPct.toFixed(2) : "—"}
//                       </td>
//                       <td className="px-3 py-2 border-b text-right font-mono">
//                         {taxInclusive ? formatMoney(lineTax, currency) : "—"}
//                       </td>
//                       <td className="px-3 py-2 border-b text-right font-mono">
//                         {formatMoney(lineTotal, currency)}
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>

//               {/* Totals: keep together on print */}
//               <tfoot className="totals-block">
//                 <tr>
//                   <td
//                     colSpan={7}
//                     className="px-3 py-2 text-right text-sm text-gray-700"
//                   >
//                     Subtotal
//                   </td>
//                   <td
//                     colSpan={2}
//                     className="px-3 py-2 text-right font-semibold font-mono"
//                   >
//                     {formatMoney(subtotal, currency)}
//                   </td>
//                 </tr>

//                 {taxInclusive && taxComponentRows.length > 0 ? (
//                   <>
//                     <tr>
//                       <td
//                         colSpan={9}
//                         className="px-3 pt-4 text-right text-xs text-gray-500"
//                       >
//                         Tax Components
//                       </td>
//                     </tr>
//                     {taxComponentRows.map((row, i) => (
//                       <tr key={`taxc-${i}`}>
//                         <td
//                           colSpan={7}
//                           className="px-3 py-1 text-right text-sm text-gray-700"
//                         >
//                           {row.name} ({row.percentage.toFixed(2)}%)
//                         </td>
//                         <td
//                           colSpan={2}
//                           className="px-3 py-1 text-right font-mono"
//                         >
//                           {formatMoney(row.amount, currency)}
//                         </td>
//                       </tr>
//                     ))}
//                   </>
//                 ) : null}

//                 <tr>
//                   <td
//                     colSpan={7}
//                     className="px-3 py-2 text-right text-sm text-gray-700"
//                   >
//                     {taxInclusive ? "Total Tax" : "Tax"}
//                   </td>
//                   <td
//                     colSpan={2}
//                     className="px-3 py-2 text-right font-semibold font-mono"
//                   >
//                     {taxInclusive
//                       ? formatMoney(totalTaxAmount, currency)
//                       : formatMoney(0, currency)}
//                   </td>
//                 </tr>

//                 {additionalChargeName && (
//                   <tr>
//                     <td
//                       colSpan={7}
//                       className="px-3 py-2 text-right text-sm text-gray-700"
//                     >
//                       {additionalChargeName}
//                     </td>
//                     <td
//                       colSpan={2}
//                       className="px-3 py-2 text-right font-semibold font-mono"
//                     >
//                       {formatMoney(additionalChargeAmount, currency)}
//                     </td>
//                   </tr>
//                 )}

//                 <tr>
//                   <td
//                     colSpan={7}
//                     className="px-3 py-3 text-right text-base font-bold"
//                   >
//                     Grand Total
//                   </td>
//                   <td
//                     colSpan={2}
//                     className="px-3 py-3 text-right font-extrabold font-mono text-lg"
//                   >
//                     {formatMoney(grandTotal, currency)}
//                   </td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>

//           {/* Signature area: keep together on print */}
//           <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 signature-block">
//             <div className="text-xs text-gray-600">
//               <div className="h-16 border-b w-60"></div>
//               <div className="mt-2">Authorised Signature</div>
//             </div>
//             <div className="text-xs text-gray-600 md:text-right">
//               <div className="h-16 border-b md:ml-auto w-60"></div>
//               <div className="mt-2">Customer Signature</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// app/orderitems/[id]/page.tsx

// app/orderitems/[id]/page.tsx
import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import type { Metadata } from "next";
import InvoiceToolbar from "./toolbar";

// ---------- Dynamic metadata to set the <title> for PDF filename ----------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    select: {
      invoiceNumber: true,
      customer: { select: { name: true } },
    },
  });

  const inv = order?.invoiceNumber?.trim() || `Invoice-${id}`;
  const cust = order?.customer?.name?.trim();
  const safeCust = cust ? cust.replace(/[<>:"/\\|?*]+/g, "_") : "Customer";

  return {
    title: `${inv} - ${safeCust}`,
    description: `Invoice ${inv} for ${safeCust}`,
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
    paid: "bg-green-100 text-green-700 border-green-300",
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

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { id: "asc" } },
      customer: {
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

  if (!order) notFound();
  if (order.organisationId !== orgId) notFound();

  // Seller (Organisation)
  const organisation = await prisma.organisation.findUnique({
    where: { id: order.organisationId },
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

  const currency = order.currency || "INR";
  const createdOn = new Date(order.createdAt);

  const subtotal = Number(order.subtotal);
  const totalTaxAmount = Number(order.totalTaxAmount);
  const taxInclusive = !!order.taxInclusive;

  // Tax components split (for inclusive mode)
  const components: { name: string; percentage: number }[] = Array.isArray(
    order.taxBreakdownJson
  )
    ? (order.taxBreakdownJson as any[])
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
  const addl = (order.additionalCharges as any) || null;
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
      .rounded, .rounded-md, .rounded-lg { border-radius: 0 !important; }
      .print-no-overflow { overflow: visible !important; }

      /* Table pagination helpers */
      table { page-break-inside: auto; border-collapse: collapse; width: 100%; }
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
          invoiceNumber={order.invoiceNumber}
          customerName={order.customer?.name ?? null}
          relativeUrl={`/orderitems/${order.id}`}
          customerEmail={order.customer?.email ?? undefined}
          customerPhone={order.customer?.contactNumber ?? undefined}
          orgName={organisation?.name ?? undefined}
        />
      </div>

      {/* Invoice Card */}
      <div className="bg-white shadow rounded border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-start justify-between gap-4 bg-linear-to-r from-cyan-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-cyan-500 text-white flex items-center justify-center font-bold text-lg">
              INV
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Invoice</h1>
              <div className="text-sm text-gray-600">
                Invoice No:{" "}
                <span className="font-mono">{order.invoiceNumber}</span>
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
            <StatusPill status={order.status} />
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
            <h3 className="text-sm font-semibold text-gray-700 mb-2">From</h3>
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
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Bill To
            </h3>
            <div className="text-sm leading-tight">
              <div className="font-medium">
                {order.customer?.name || "Customer"}
              </div>
              {order.customer?.taxNumber && (
                <div className="text-gray-600">
                  Tax No: {order.customer?.taxNumber}
                </div>
              )}
              {(order.customer?.address1 || order.customer?.address2) && (
                <div className="text-gray-700">
                  {order.customer?.address1}
                  {order.customer?.address2
                    ? `, ${order.customer?.address2}`
                    : ""}
                  <br />
                  {[
                    order.customer?.state,
                    order.customer?.zipcode,
                    order.customer?.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}
              {(order.customer?.email || order.customer?.contactNumber) && (
                <div className="text-gray-600 mt-1">
                  {order.customer?.email && <div>{order.customer?.email}</div>}
                  {order.customer?.contactNumber && (
                    <div>{order.customer?.contactNumber}</div>
                  )}
                </div>
              )}

              {/* Contact Person inline & compact */}
              {order.contact && (
                <div className="mt-2 text-[12px] text-gray-700 leading-tight">
                  <span className="font-semibold">Contact:</span>{" "}
                  <span>{order.contact?.name}</span>
                  {order.contact?.email && (
                    <>
                      {" "}
                      <span className="text-gray-400">•</span>{" "}
                      <span className="text-gray-600">
                        {order.contact?.email}
                      </span>
                    </>
                  )}
                  {order.contact?.contactNumber && (
                    <>
                      {" "}
                      <span className="text-gray-400">•</span>{" "}
                      <span className="text-gray-600">
                        {order.contact?.contactNumber}
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
                    Line Total (excl. Tax)
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it, idx) => {
                  const qty = Number(it.quantity);
                  const unitCatalog = Number(it.unitPrice); // catalog snapshot
                  const unitCharged = Number(it.actualprice); // charged per-unit EXCL tax
                  const taxPct = Number(it.taxRatePct);
                  const lineTax = Number(it.lineTaxAmount);
                  const lineTotalExcl = Number(it.lineTotal) - lineTax; // excl. tax

                  let discountLabel: string | null = null;
                  let isMarkup = false;
                  if (Number.isFinite(unitCatalog) && unitCatalog > 0) {
                    const pct = round2(
                      ((unitCatalog - unitCharged) / unitCatalog) * 100
                    );
                    if (pct > 0) {
                      discountLabel = `Disc ${pct.toFixed(2)}%`;
                    } else if (pct < 0) {
                      discountLabel = `Markup ${Math.abs(pct).toFixed(2)}%`;
                      isMarkup = true; // hide catalog & markup line
                    }
                  }

                  return (
                    <tr key={it.id} className="text-sm">
                      <td className="px-2.5 py-1.5 border-b text-gray-600">
                        {idx + 1}
                      </td>
                      <td className="px-2.5 py-1.5 border-b">
                        <div className="font-medium text-gray-900">
                          {it.productname}
                        </div>
                        {!isMarkup && (
                          <div className="text-xs text-gray-500">
                            Catalog: {formatAmount(unitCatalog)}
                            {discountLabel &&
                            discountLabel.startsWith("Disc") ? (
                              <> · {discountLabel}</>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className="px-2.5 py-1.5 border-b text-gray-700">
                        {it.sku}
                      </td>
                      <td className="px-2.5 py-1.5 border-b text-gray-700">
                        {it.HSN}
                      </td>
                      <td className="px-2.5 py-1.5 border-b text-right font-mono">
                        {qty}
                      </td>
                      <td className="px-2.5 py-1.5 border-b text-right font-mono">
                        {formatAmount(unitCharged)}
                      </td>
                      <td className="px-2.5 py-1.5 border-b text-right font-mono">
                        {taxInclusive ? taxPct.toFixed(2) : "—"}
                      </td>
                      <td className="px-2.5 py-1.5 border-b text-right font-mono">
                        {taxInclusive ? formatAmount(lineTax) : "—"}
                      </td>
                      <td className="px-2.5 py-1.5 border-b text-right font-mono">
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
                  <div className="h-14 border-b w-56"></div>
                  <div className="mt-1">
                    Sold by, <br /> {organisation?.name || "Organisation"}
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
