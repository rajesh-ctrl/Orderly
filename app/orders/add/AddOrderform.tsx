// // app/orders/add/AddOrderForm.tsx
// "use client";

// import { useMemo, useRef, useState } from "react";
// import { addOrder } from "../order";

// type Product = {
//   id: number;
//   name: string;
//   price: number; // catalog unit price
//   taxRatePct: number; // %
//   currency: string;
//   sku: string;
//   HSN: string;
// };
// type Customer = { id: number; name: string };
// type Contact = { id: number; name: string; customerId: number | null };

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

// export default function AddOrderForm({
//   products,
//   customers,
//   contacts,
// }: {
//   products: Product[];
//   customers: Customer[];
//   contacts: Contact[];
// }) {
//   // Header: combobox states
//   const [customerId, setCustomerId] = useState<number | "">("");
//   const [customerQuery, setCustomerQuery] = useState<string>("");
//   const [customerOpen, setCustomerOpen] = useState<boolean>(false);

//   const [contactId, setContactId] = useState<number | "">("");
//   const [contactQuery, setContactQuery] = useState<string>("");
//   const [contactOpen, setContactOpen] = useState<boolean>(false);

//   const [currency, setCurrency] = useState<string>("INR");
//   const [status, setStatus] = useState<string>("Pending");

//   // Items: single-row, many columns + combobox per product
//   const [items, setItems] = useState<
//     {
//       productId: number | "";
//       query: string; // combobox query (Name/SKU/HSN)
//       quantity: number;
//       unitPrice: number; // overwritten per-unit price
//       taxPct: number; // editable per-line tax %
//       open: boolean; // product dropdown visibility
//     }[]
//   >([
//     {
//       productId: "",
//       query: "",
//       quantity: 1,
//       unitPrice: 0,
//       taxPct: 0,
//       open: false,
//     },
//   ]);

//   const round2 = (n: number) => Math.round(n * 100) / 100;
//   const getProduct = (id: number | "") =>
//     typeof id === "number" ? products.find((p) => p.id === id) : undefined;

//   // Filter helpers
//   const filterProducts = (q: string) => {
//     const x = (q || "").trim().toLowerCase();
//     if (!x) return products;
//     return products.filter(
//       (p) =>
//         p.name.toLowerCase().includes(x) ||
//         p.sku.toLowerCase().includes(x) ||
//         p.HSN.toLowerCase().includes(x)
//     );
//   };
//   const filterCustomers = (q: string) => {
//     const x = (q || "").trim().toLowerCase();
//     if (!x) return customers;
//     return customers.filter((c) => c.name.toLowerCase().includes(x));
//   };
//   const filteredContacts = useMemo(() => {
//     if (!customerId || typeof customerId !== "number") return [];
//     return contacts.filter((c) => c.customerId === customerId);
//   }, [contacts, customerId]);
//   const filterContacts = (q: string) => {
//     const x = (q || "").trim().toLowerCase();
//     const list = filteredContacts;
//     if (!x) return list;
//     return list.filter((c) => c.name.toLowerCase().includes(x));
//   };

//   // Totals preview (excl tax, total tax, incl)
//   const totals = useMemo(() => {
//     let excl = 0;
//     let tax = 0;
//     for (const row of items) {
//       if (!row.productId || typeof row.productId !== "number") continue;
//       const lineExcl = round2(row.unitPrice * row.quantity);
//       const rate = (row.taxPct || 0) / 100;
//       const lineTax = round2(lineExcl * rate);
//       excl += lineExcl;
//       tax += lineTax;
//     }
//     const incl = round2(excl + tax);
//     return { excl: round2(excl), tax: round2(tax), incl };
//   }, [items]);

//   // Discount% relative to catalog (positive=discount, negative=markup)
//   const discountPct = (productId: number | "", manualUnit: number) => {
//     if (!productId || typeof productId !== "number") return 0;
//     const p = getProduct(productId);
//     if (!p || p.price <= 0) return 0;
//     return round2(((p.price - manualUnit) / p.price) * 100);
//   };

//   // Handlers
//   const addRow = () =>
//     setItems((prev) => [
//       ...prev,
//       {
//         productId: "",
//         query: "",
//         quantity: 1,
//         unitPrice: 0,
//         taxPct: 0,
//         open: false,
//       },
//     ]);
//   const removeRow = (index: number) =>
//     setItems((prev) => prev.filter((_, i) => i !== index));

//   const updateItem = (
//     index: number,
//     field: "query" | "productId" | "quantity" | "unitPrice" | "taxPct" | "open",
//     value: string | number | boolean
//   ) => {
//     setItems((prev) => {
//       const next = [...prev];
//       const row = { ...next[index] };

//       if (field === "open") {
//         row.open = Boolean(value);
//       } else if (field === "query") {
//         row.query = String(value);
//         row.open = true;
//       } else if (field === "productId") {
//         const pid = Number(value);
//         row.productId = Number.isFinite(pid) ? pid : "";
//         const p = getProduct(pid);
//         if (p) {
//           row.unitPrice = p.price; // default unit price to catalog
//           row.taxPct = p.taxRatePct; // default tax% to product tax
//           row.quantity = 1;
//           // friendly preview
//           row.query = `${p.name} [${p.sku}] [${p.HSN}]`;
//           row.open = false;
//           if (!currency) setCurrency(p.currency || "INR");
//         } else {
//           row.unitPrice = 0;
//           row.taxPct = 0;
//           row.quantity = 1;
//         }
//       } else if (field === "quantity") {
//         const qty = Number(value);
//         if (!Number.isFinite(qty) || qty <= 0) {
//           alert("Quantity must be greater than zero");
//           return prev;
//         }
//         row.quantity = qty;
//       } else if (field === "unitPrice") {
//         const up = Number(value);
//         if (!Number.isFinite(up) || up <= 0) {
//           alert("Unit price must be greater than zero");
//           return prev;
//         }
//         row.unitPrice = up;
//       } else if (field === "taxPct") {
//         const tp = Number(value);
//         if (!Number.isFinite(tp) || tp < 0) {
//           alert("Tax % must be a valid non-negative number");
//           return prev;
//         }
//         row.taxPct = tp;
//       }

//       next[index] = row;
//       return next;
//     });
//   };

//   // ===== Render =====
//   return (
//     <div className="p-4 md:p-6 w-full max-w-8xl mx-auto">
//       <h1 className="text-xl md:text-2xl font-bold mb-4">Add Order</h1>
//       <h3 className="text-sm md:text-base font-light mb-6">
//         Register a new order to generate invoice
//       </h3>

//       <form
//         action={addOrder}
//         className="flex flex-col gap-4 bg-gray-50 p-4 rounded shadow"
//       >
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {/* Customer combobox */}
//           <div className="relative">
//             <span className="block text-sm text-gray-700 mb-1">Customer</span>
//             <input
//               type="text"
//               className="w-full border bg-white border-gray-300 p-2 rounded text-sm md:text-base"
//               value={customerQuery}
//               onFocus={() => setCustomerOpen(true)}
//               onChange={(e) => setCustomerQuery(e.target.value)}
//               placeholder="Type to search by name..."
//               required
//             />
//             {customerOpen && (
//               <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto border border-gray-300 bg-white rounded shadow">
//                 {filterCustomers(customerQuery).length === 0 ? (
//                   <div className="px-3 py-2 text-sm text-gray-500">
//                     No matches
//                   </div>
//                 ) : (
//                   filterCustomers(customerQuery).map((c) => (
//                     <button
//                       key={c.id}
//                       type="button"
//                       onClick={() => {
//                         setCustomerId(c.id);
//                         setCustomerQuery(c.name);
//                         setCustomerOpen(false);
//                         // reset contact
//                         setContactId("");
//                         setContactQuery("");
//                       }}
//                       className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
//                     >
//                       {c.name}
//                     </button>
//                   ))
//                 )}
//               </div>
//             )}
//             {/* Hidden post field */}
//             {customerId && (
//               <input
//                 type="hidden"
//                 name="customerId"
//                 value={String(customerId)}
//               />
//             )}
//           </div>

//           {/* Contact combobox (filtered by customer) */}
//           <div className="relative">
//             <span className="block text-sm text-gray-700 mb-1">Contact</span>
//             <input
//               type="text"
//               className="w-full border bg-white border-gray-300 p-2 rounded text-sm md:text-base"
//               value={contactQuery}
//               onFocus={() => setContactOpen(true)}
//               onChange={(e) => setContactQuery(e.target.value)}
//               placeholder="Type to search contact..."
//               disabled={!customerId}
//             />
//             {contactOpen && (
//               <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto border border-gray-300 bg-white rounded shadow">
//                 {filterContacts(contactQuery).length === 0 ? (
//                   <div className="px-3 py-2 text-sm text-gray-500">
//                     No matches
//                   </div>
//                 ) : (
//                   filterContacts(contactQuery).map((ct) => (
//                     <button
//                       key={ct.id}
//                       type="button"
//                       onClick={() => {
//                         setContactId(ct.id);
//                         setContactQuery(ct.name);
//                         setContactOpen(false);
//                       }}
//                       className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
//                     >
//                       {ct.name}
//                     </button>
//                   ))
//                 )}
//               </div>
//             )}
//             {contactId && (
//               <input type="hidden" name="contactId" value={String(contactId)} />
//             )}
//           </div>
//         </div>

//         {/* Currency + Status */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <label className="flex flex-col gap-2">
//             <span className="text-sm text-gray-700">Currency</span>
//             <select
//               name="currency"
//               className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
//               value={currency}
//               onChange={(e) => setCurrency(e.target.value)}
//               required
//             >
//               <option value="INR">INR — Indian Rupee</option>
//               <option value="USD">USD — US Dollar</option>
//               <option value="EUR">EUR — Euro</option>
//               <option value="GBP">GBP — British Pound</option>
//               <option value="AED">AED — UAE Dirham</option>
//               <option value="SGD">SGD — Singapore Dollar</option>
//               <option value="AUD">AUD — Australian Dollar</option>
//               <option value="CAD">CAD — Canadian Dollar</option>
//               <option value="JPY">JPY — Japanese Yen</option>
//             </select>
//           </label>

//           <label className="flex flex-col gap-2">
//             <span className="text-sm text-gray-700">Status</span>
//             <select
//               name="status"
//               className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
//               value={status}
//               onChange={(e) => setStatus(e.target.value)}
//             >
//               <option value="Pending">Pending</option>
//               <option value="Paid">Paid</option>
//               <option value="Cancelled">Cancelled</option>
//             </select>
//           </label>
//         </div>

//         {/* ===== Line Items: single FLEX ROW, responsive ===== */}
//         <div className="space-y-3">
//           {items.map((row, index) => {
//             const p = getProduct(row.productId);
//             const list = filterProducts(row.query);
//             const lineTotal = round2(row.unitPrice * row.quantity);
//             const pct = p
//               ? round2(((p.price - row.unitPrice) / p.price) * 100)
//               : 0;

//             return (
//               <div
//                 key={index}
//                 className="flex flex-wrap  items-end gap-2 md:gap-3 border border-gray-200 p-3 rounded bg-white"
//               >
//                 {/* Product combobox (single field) */}
//                 <div className="relative flex-1 min-w-[220px]">
//                   <span className="block text-xs text-gray-700 mb-1">
//                     Product (Search Name/SKU/HSN)
//                   </span>
//                   <input
//                     type="text"
//                     className="w-full border bg-white border-gray-300 p-2 rounded text-sm font-mono"
//                     value={row.query}
//                     onFocus={() => updateItem(index, "open", true)}
//                     onChange={(e) => updateItem(index, "query", e.target.value)}
//                     placeholder="Type to search..."
//                   />
//                   {row.open && (
//                     <div className="absolute z-20 mt-1 w-full max-h-52 overflow-auto border border-gray-300 bg-white rounded shadow">
//                       {list.length === 0 ? (
//                         <div className="px-3 py-2 text-sm text-gray-500">
//                           No matches
//                         </div>
//                       ) : (
//                         list.map((opt) => (
//                           <button
//                             key={opt.id}
//                             type="button"
//                             onClick={() =>
//                               updateItem(index, "productId", opt.id)
//                             }
//                             className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
//                           >
//                             <div className="font-medium">{opt.name}</div>
//                             <div className="text-xs text-gray-600 font-mono">
//                               SKU: {opt.sku} · HSN: {opt.HSN} · Tax:{" "}
//                               {opt.taxRatePct.toFixed(2)}%
//                             </div>
//                           </button>
//                         ))
//                       )}
//                     </div>
//                   )}
//                   {/* Hidden post field */}
//                   {row.productId && (
//                     <input
//                       type="hidden"
//                       name="productId"
//                       value={String(row.productId)}
//                     />
//                   )}
//                 </div>

//                 {/* SKU */}
//                 <div className="w-32">
//                   <span className="block text-xs text-gray-700 mb-1">SKU</span>
//                   <div className="border bg-gray-50 border-gray-300 p-2 rounded text-sm font-mono">
//                     {p?.sku ?? ""}
//                   </div>
//                 </div>

//                 {/* HSN */}
//                 <div className="w-28">
//                   <span className="block text-xs text-gray-700 mb-1">HSN</span>
//                   <div className="border bg-gray-50 border-gray-300 p-2 rounded text-sm font-mono">
//                     {p?.HSN ?? ""}
//                   </div>
//                 </div>

//                 {/* Tax% (editable) */}
//                 <label className="w-18 flex flex-col">
//                   <span className="text-xs text-gray-700 mb-1">Tax %</span>
//                   <input
//                     type="number"
//                     name="taxRatePct"
//                     className="border bg-white border-gray-300 p-2 rounded text-sm"
//                     step="0.01"
//                     min={0}
//                     value={row.taxPct}
//                     onChange={(e) =>
//                       updateItem(index, "taxPct", Number(e.target.value))
//                     }
//                     required
//                     disabled={!row.productId}
//                   />
//                 </label>

//                 {/* Qty */}
//                 <label className="w-24 flex flex-col">
//                   <span className="text-xs text-gray-700 mb-1">Qty</span>
//                   <input
//                     type="number"
//                     name="quantity"
//                     className="border bg-white border-gray-300 p-2 rounded text-sm"
//                     min={1}
//                     value={row.quantity}
//                     onChange={(e) =>
//                       updateItem(index, "quantity", Number(e.target.value))
//                     }
//                     required
//                     disabled={!row.productId}
//                   />
//                 </label>

//                 {/* Unit Price (editable) + subtext */}
//                 <label className="w-36 flex flex-col">
//                   <span className="text-xs text-gray-700 mb-1">Unit Price</span>
//                   <input
//                     type="number"
//                     name="unitPrice"
//                     className="border bg-white border-gray-300 p-2 rounded text-sm"
//                     step="0.01"
//                     min={0.01}
//                     value={row.unitPrice}
//                     onChange={(e) =>
//                       updateItem(index, "unitPrice", Number(e.target.value))
//                     }
//                     required
//                     disabled={!row.productId}
//                   />
//                   {/* {p && (
//                     <div className="text-[11px] mt-1">
//                       <span className="text-gray-600">
//                         Catalog: {formatMoney(p.price, currency)}{" "}
//                       </span>
//                       <span
//                         className={
//                           pct >= 0 ? "text-green-700" : "text-orange-700"
//                         }
//                       >
//                         ({pct >= 0 ? "Disc" : "Markup"} {pct.toFixed(2)}%)
//                       </span>
//                     </div>
//                   )} */}
//                 </label>

//                 {/* markup */}
//                 <div className="w-32">
//                   {/* <span className="block text-xs text-gray-700 mb-1">SKU</span> */}
//                   <div className="border bg-gray-50 border-gray-300  rounded text-sm font-mono">
//                     {p && (
//                       <div className="text-[11px] flex-col py-2 pl-4 ">
//                         <span className="text-gray-600">
//                           Catalog: {formatMoney(p.price, currency)}{" "}
//                         </span>
//                         <span
//                           className={
//                             pct >= 0 ? "text-green-700" : "text-orange-700"
//                           }
//                         >
//                           ({pct >= 0 ? "Disc" : "Markup"} {pct.toFixed(2)}%)
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Line Total (excl. tax) */}
//                 <div className="w-40">
//                   <span className="block text-xs text-gray-700 mb-1">
//                     Line Total
//                   </span>
//                   <div className="border bg-gray-50 border-gray-300 p-2 rounded text-sm font-mono">
//                     {formatMoney(
//                       round2(row.unitPrice * row.quantity),
//                       currency
//                     )}
//                   </div>
//                 </div>

//                 {/* Remove */}
//                 <div className="w-10 flex justify-end md:justify-center">
//                   <button
//                     type="button"
//                     onClick={() => removeRow(index)}
//                     title="Remove Item"
//                     className="mt-[22px] bg-gray-100 hover:bg-gray-200 text-red-500 w-8 h-8 justify-center rounded-full border border-gray-300 flex items-center shadow-sm transition"
//                   >
//                     <span className="text-red-500 font-bold text-xl">−</span>
//                   </button>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* Totals (currency-aware) */}
//         <div className="text-right space-y-1">
//           <div className="text-base font-semibold">
//             Total (excl. tax):{" "}
//             <span className="font-mono">
//               {formatMoney(totals.excl, currency)}
//             </span>
//           </div>
//           <div className="text-sm text-gray-700">
//             Total tax:{" "}
//             <span className="font-mono">
//               {formatMoney(totals.tax, currency)}
//             </span>
//           </div>
//           <div className="text-lg font-bold">
//             Total (incl. tax):{" "}
//             <span className="font-mono">
//               {formatMoney(totals.incl, currency)}
//             </span>
//           </div>
//         </div>

//         <div className="flex gap-2">
//           <button
//             type="button"
//             onClick={addRow}
//             className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
//           >
//             + Add Item
//           </button>

//           <button
//             type="submit"
//             className="bg-cyan-400 hover:bg-cyan-500 text-white px-4 py-2 rounded font-semibold"
//           >
//             Create Order
//           </button>
//         </div>

//         <h3 className="text-sm md:text-base font-light mb-2 italic">
//           Line item prices are entered without tax. Tax% is editable per line
//           and reflected in totals. Discount% is shown vs catalog unit price.
//           After submission, line items are fixed.
//         </h3>
//       </form>
//     </div>
//   );
// }

// app/orders/add/AddOrderForm.tsx

// app/orders/add/AddOrderForm.tsx
"use client";

import { useMemo, useState } from "react";
import { addOrder } from "../order";

// ===== Types (align with your data) =====
type Product = {
  id: number;
  name: string;
  price: number; // catalog unit price snapshot
  taxRatePct: number; // default product tax %
  currency: string;
  sku: string;
  HSN: string;
};

type Customer = { id: number; name: string };
type Contact = { id: number; name: string; customerId: number | null };

type TaxComponent = { name: string; percentage: number };
type AdditionalCharges = { name: string; amount: number };

// ===== Helpers =====
const round2 = (n: number) => Math.round(n * 100) / 100;

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

export default function AddOrderForm({
  products,
  customers,
  contacts,
}: {
  products: Product[];
  customers: Customer[];
  contacts: Contact[];
}) {
  // ===== Header state =====
  const [customerId, setCustomerId] = useState<number | "">("");
  const [customerQuery, setCustomerQuery] = useState<string>("");
  const [customerOpen, setCustomerOpen] = useState<boolean>(false);

  const [contactId, setContactId] = useState<number | "">("");
  const [contactQuery, setContactQuery] = useState<string>("");
  const [contactOpen, setContactOpen] = useState<boolean>(false);

  const [currency, setCurrency] = useState<string>("INR");
  const [status, setStatus] = useState<string>("Pending");

  // ===== Tax / Charges =====
  const [taxInclusive, setTaxInclusive] = useState<boolean>(false); // schema default = false
  const [taxComponents, setTaxComponents] = useState<TaxComponent[]>([]);
  const [additionalCharges, setAdditionalCharges] =
    useState<AdditionalCharges | null>(null);

  // ===== Items =====
  const [items, setItems] = useState<
    {
      productId: number | "";
      query: string; // combobox query (Name/SKU/HSN)
      quantity: number;
      unitPrice: number; // user-entered per-unit (EXCL tax)
      taxPct: number; // per-line tax %
      open: boolean; // product dropdown visibility
    }[]
  >([
    {
      productId: "",
      query: "",
      quantity: 1,
      unitPrice: 0,
      taxPct: 0,
      open: false,
    },
  ]);

  // ===== Helpers =====
  const getProduct = (id: number | "") =>
    typeof id === "number" ? products.find((p) => p.id === id) : undefined;

  const filterProducts = (q: string) => {
    const x = (q || "").trim().toLowerCase();
    if (!x) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(x) ||
        p.sku.toLowerCase().includes(x) ||
        p.HSN.toLowerCase().includes(x)
    );
  };

  const filterCustomers = (q: string) => {
    const x = (q || "").trim().toLowerCase();
    if (!x) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(x));
  };

  const filteredContacts = useMemo(() => {
    if (!customerId || typeof customerId !== "number") return [];
    return contacts.filter((c) => c.customerId === customerId);
  }, [contacts, customerId]);

  const filterContacts = (q: string) => {
    const x = (q || "").trim().toLowerCase();
    const list = filteredContacts;
    if (!x) return list;
    return list.filter((c) => c.name.toLowerCase().includes(x));
  };

  // ===== Item handlers =====
  const addRow = () =>
    setItems((prev) => [
      ...prev,
      {
        productId: "",
        query: "",
        quantity: 1,
        unitPrice: 0,
        taxPct: 0,
        open: false,
      },
    ]);

  const removeRow = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (
    index: number,
    field: "query" | "productId" | "quantity" | "unitPrice" | "taxPct" | "open",
    value: string | number | boolean
  ) => {
    setItems((prev) => {
      const next = [...prev];
      const row = { ...next[index] };

      if (field === "open") {
        row.open = Boolean(value);
      } else if (field === "query") {
        row.query = String(value);
        row.open = true;
      } else if (field === "productId") {
        const pid = Number(value);
        row.productId = Number.isFinite(pid) ? pid : "";
        const p = getProduct(pid);
        if (p) {
          row.unitPrice = Number(p.price); // EXCL tax
          row.taxPct = Number(p.taxRatePct); // default product tax
          row.quantity = 1;
          row.query = `${p.name} [${p.sku}] [${p.HSN}]`;
          row.open = false;
          if (!currency) setCurrency(p.currency || "INR");
        } else {
          row.unitPrice = 0;
          row.taxPct = 0;
          row.quantity = 1;
        }
      } else if (field === "quantity") {
        const qty = Number(value);
        if (!Number.isFinite(qty) || qty <= 0) {
          alert("Quantity must be greater than zero");
          return prev;
        }
        row.quantity = qty;
      } else if (field === "unitPrice") {
        const up = Number(value);
        if (!Number.isFinite(up) || up <= 0) {
          alert("Unit price must be greater than zero");
          return prev;
        }
        row.unitPrice = up;
      } else if (field === "taxPct") {
        const tp = Number(value);
        if (!Number.isFinite(tp) || tp < 0) {
          alert("Tax % must be a valid non-negative number");
          return prev;
        }
        row.taxPct = tp;
      }

      next[index] = row;
      return next;
    });
  };

  // ===== Tax Components (max 2, sum must be 100 when inclusive) =====
  const addTaxComponent = () => {
    if (taxComponents.length >= 2) return; // cap at two
    const defaultPct = taxComponents.length === 0 ? 100 : 50;
    setTaxComponents((prev) => [...prev, { name: "", percentage: defaultPct }]);
  };

  const updateTaxComponent = (idx: number, patch: Partial<TaxComponent>) =>
    setTaxComponents((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, ...patch } : t))
    );

  const removeTaxComponent = (idx: number) =>
    setTaxComponents((prev) => prev.filter((_, i) => i !== idx));

  // ===== Additional Charges (only one) =====
  const addAdditionalCharges = () => {
    if (!additionalCharges) setAdditionalCharges({ name: "", amount: 0 });
  };
  const removeAdditionalCharges = () => setAdditionalCharges(null);

  // ===== Totals preview =====
  const totals = useMemo(() => {
    let baseExcl = 0;
    let tax = 0;

    for (const row of items) {
      if (!row.productId || typeof row.productId !== "number") continue;
      const qty = Number(row.quantity);
      const rate = (Number(row.taxPct) || 0) / 100;
      const base = round2(Number(row.unitPrice) * qty); // unit price is EXCL tax
      baseExcl += base;
      if (taxInclusive) tax += round2(base * rate);
    }

    const incl = round2(baseExcl + tax);
    const grand = round2(incl + (additionalCharges?.amount || 0));

    return { excl: round2(baseExcl), tax: round2(tax), incl, grand };
  }, [items, taxInclusive, additionalCharges]);

  // ===== Tax components sum must be exactly 100 when inclusive =====
  const taxComponentsSum = useMemo(
    () =>
      round2(
        taxComponents.reduce(
          (s, t) => s + (Number.isFinite(t.percentage) ? t.percentage : 0),
          0
        )
      ),
    [taxComponents]
  );
  const remainingPct = useMemo(
    () => round2(100 - taxComponentsSum),
    [taxComponentsSum]
  );
  const taxComponentsValid = !taxInclusive
    ? true
    : taxComponents.length > 0 &&
      taxComponents.length <= 2 &&
      Math.abs(taxComponentsSum - 100) < 0.000001;

  // ===== Filters (Customer/Contact) =====
  const customerList = filterCustomers(customerQuery);
  const contactList = filterContacts(contactQuery);

  // ===== Render =====
  return (
    <div className="p-4 md:p-6 w-full max-w-8xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-2">Add Order</h1>
      <h3 className="text-sm md:text-base font-light mb-6">
        Register a new order to generate invoice
      </h3>

      <form
        action={addOrder}
        className="flex flex-col gap-4 bg-gray-50 p-4 rounded shadow"
      >
        {/* Header: Customer / Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer combobox */}
          <div className="relative">
            <span className="block text-sm text-gray-700 mb-1">Customer</span>
            <input
              type="text"
              className="w-full border bg-white border-gray-300 p-2 rounded text-sm md:text-base"
              value={customerQuery}
              onFocus={() => setCustomerOpen(true)}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="Type to search by name..."
              required
            />
            {customerOpen && (
              <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto border border-gray-300 bg-white rounded shadow">
                {customerList.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No matches
                  </div>
                ) : (
                  customerList.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCustomerId(c.id);
                        setCustomerQuery(c.name);
                        setCustomerOpen(false);
                        setContactId("");
                        setContactQuery("");
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      {c.name}
                    </button>
                  ))
                )}
              </div>
            )}
            {customerId && (
              <input
                type="hidden"
                name="customerId"
                value={String(customerId)}
              />
            )}
          </div>

          {/* Contact combobox */}
          <div className="relative">
            <span className="block text-sm text-gray-700 mb-1">Contact</span>
            <input
              type="text"
              className="w-full border bg-white border-gray-300 p-2 rounded text-sm md:text-base"
              value={contactQuery}
              onFocus={() => setContactOpen(true)}
              onChange={(e) => setContactQuery(e.target.value)}
              placeholder="Type to search contact..."
              disabled={!customerId}
            />
            {contactOpen && (
              <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto border border-gray-300 bg-white rounded shadow">
                {contactList.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No matches
                  </div>
                ) : (
                  contactList.map((ct) => (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => {
                        setContactId(ct.id);
                        setContactQuery(ct.name);
                        setContactOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      {ct.name}
                    </button>
                  ))
                )}
              </div>
            )}
            {contactId && (
              <input type="hidden" name="contactId" value={String(contactId)} />
            )}
          </div>
        </div>

        {/* Currency / Status / Tax Mode */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Currency</span>
            <select
              name="currency"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              required
            >
              <option value="INR">INR — Indian Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="AED">AED — UAE Dirham</option>
              <option value="SGD">SGD — Singapore Dollar</option>
              <option value="AUD">AUD — Australian Dollar</option>
              <option value="CAD">CAD — Canadian Dollar</option>
              <option value="JPY">JPY — Japanese Yen</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Status</span>
            <select
              name="status"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>

          {/* Tax Mode toggle */}
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Tax Mode</span>
            <button
              type="button"
              role="switch"
              aria-checked={taxInclusive}
              onClick={() => setTaxInclusive((v) => !v)}
              className={`p-2 rounded border transition ${
                taxInclusive
                  ? "bg-cyan-500 text-white border-cyan-600"
                  : "bg-gray-100 border-gray-300"
              }`}
              title="Toggle whether order totals include tax"
            >
              {taxInclusive ? "Inclusive (tax applied)" : "Exclusive (no tax)"}
            </button>
            <input
              type="hidden"
              name="taxInclusive"
              value={String(taxInclusive)}
            />
          </div>
        </div>

        {/* ===== Line Items ===== */}
        <div className="space-y-3">
          {items.map((row, index) => {
            const p = getProduct(row.productId);
            const list = filterProducts(row.query);

            // Line total (always EXCL tax)
            const lineTotalExcl = round2(
              Number(row.unitPrice) * Number(row.quantity)
            );

            // Catalog vs discount/markup
            const hasCatalog = p && Number(p.price) > 0;
            const diffPct = hasCatalog
              ? round2(
                  ((Number(p!.price) - Number(row.unitPrice)) /
                    Number(p!.price)) *
                    100
                )
              : 0;
            const isDiscount = hasCatalog && diffPct > 0;
            const isMarkup = hasCatalog && diffPct < 0;

            return (
              <div
                key={index}
                className="flex flex-wrap items-end gap-2 md:gap-3 border border-gray-200 p-3 rounded bg-white"
              >
                {/* Product combobox */}
                <div className="relative flex-1 min-w-[220px]">
                  <span className="block text-xs text-gray-700 mb-1">
                    Product (Search Name/SKU/HSN)
                  </span>
                  <input
                    type="text"
                    className="w-full border bg-white border-gray-300 p-2 rounded text-sm font-mono"
                    value={row.query}
                    onFocus={() => updateItem(index, "open", true)}
                    onChange={(e) => updateItem(index, "query", e.target.value)}
                    placeholder="Type to search..."
                  />
                  {row.open && (
                    <div className="absolute z-20 mt-1 w-full max-h-52 overflow-auto border border-gray-300 bg-white rounded shadow">
                      {list.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No matches
                        </div>
                      ) : (
                        list.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              updateItem(index, "productId", opt.id)
                            }
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                          >
                            <div className="font-medium">{opt.name}</div>
                            <div className="text-xs text-gray-600 font-mono">
                              SKU: {opt.sku} · HSN: {opt.HSN} · Tax:{" "}
                              {Number(opt.taxRatePct).toFixed(2)}%
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {row.productId && (
                    <input
                      type="hidden"
                      name="productId"
                      value={String(row.productId)}
                    />
                  )}

                  {/* Catalog vs Discount/Markup context (under product) */}
                  {p && (
                    <div className="mt-1 text-[11px] text-gray-600">
                      <span>
                        Catalog: {formatMoney(Number(p.price), currency)}
                      </span>
                      {isDiscount && (
                        <span className="ml-2 text-green-700">
                          · Disc {Math.abs(diffPct).toFixed(2)}%
                        </span>
                      )}
                      {isMarkup && (
                        <span className="ml-2 text-orange-700">
                          · Markup {Math.abs(diffPct).toFixed(2)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* SKU */}
                <div className="w-32">
                  <span className="block text-xs text-gray-700 mb-1">SKU</span>
                  <div className="border bg-gray-50 border-gray-300 p-2 rounded text-sm font-mono">
                    {p?.sku ?? ""}
                  </div>
                </div>

                {/* HSN */}
                <div className="w-28">
                  <span className="block text-xs text-gray-700 mb-1">HSN</span>
                  <div className="border bg-gray-50 border-gray-300 p-2 rounded text-sm font-mono">
                    {p?.HSN ?? ""}
                  </div>
                </div>

                {/* Tax % */}
                <label className="w-18 flex flex-col">
                  <span className="text-xs text-gray-700 mb-1">Tax %</span>
                  <input
                    type="number"
                    name="taxRatePct"
                    className="border bg-white border-gray-300 p-2 rounded text-sm"
                    step={0.01}
                    min={0}
                    value={Number.isFinite(row.taxPct) ? row.taxPct : 0}
                    onChange={(e) =>
                      updateItem(index, "taxPct", Number(e.target.value))
                    }
                    required
                    disabled={!row.productId}
                  />
                </label>

                {/* Qty */}
                <label className="w-24 flex flex-col">
                  <span className="text-xs text-gray-700 mb-1">Qty</span>
                  <input
                    type="number"
                    name="quantity"
                    className="border bg-white border-gray-300 p-2 rounded text-sm"
                    min={1}
                    value={Number.isFinite(row.quantity) ? row.quantity : 1}
                    onChange={(e) =>
                      updateItem(index, "quantity", Number(e.target.value))
                    }
                    required
                    disabled={!row.productId}
                  />
                </label>

                {/* Unit Price (EXCL tax) */}
                <label className="w-36 flex flex-col">
                  <span className="text-xs text-gray-700 mb-1">
                    Unit Price (excl. tax)
                  </span>
                  <input
                    type="number"
                    name="unitPrice"
                    className="border bg-white border-gray-300 p-2 rounded text-sm"
                    step={0.01}
                    min={0.01}
                    value={Number.isFinite(row.unitPrice) ? row.unitPrice : 0}
                    onChange={(e) =>
                      updateItem(index, "unitPrice", Number(e.target.value))
                    }
                    required
                    disabled={!row.productId}
                  />
                </label>

                {/* Line Total (excl. tax) */}
                <div className="w-40">
                  <span className="block text-xs text-gray-700 mb-1">
                    Line Total (excl. tax)
                  </span>
                  <div className="border bg-gray-50 border-gray-300 p-2 rounded text-sm font-mono">
                    {formatMoney(lineTotalExcl, currency)}
                  </div>
                </div>

                {/* Remove row */}
                <div className="w-10 flex justify-end md:justify-center">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    title="Remove Item"
                    className="mt-[22px] bg-gray-100 hover:bg-gray-200 text-red-500 w-8 h-8 justify-center rounded-full border border-gray-300 flex items-center shadow-sm transition"
                  >
                    <span className="text-red-500 font-bold text-xl">−</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===== Totals / Controls ===== */}
        <div className="text-right space-y-1">
          <div className="text-base font-semibold">
            Total (excl. tax):{" "}
            <span className="font-mono">
              {formatMoney(totals.excl, currency)}
            </span>
          </div>

          {/* Total tax: disabled when Exclusive */}
          <div
            className={`text-sm ${
              taxInclusive ? "text-gray-700" : "text-gray-400"
            }`}
          >
            Total tax:{" "}
            <span className="font-mono">
              {taxInclusive ? formatMoney(totals.tax, currency) : "—"}
            </span>
          </div>

          {/* + Add Tax Component (between Total tax and Total incl. tax) */}
          <div className="flex justify-end items-center gap-3">
            {/* Remaining badge when inclusive */}
            {taxInclusive && (
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-mono ${
                  remainingPct === 0
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
                title="Remaining percentage to reach 100%"
              >
                Remaining: {remainingPct.toFixed(2)}%
              </span>
            )}
            <button
              type="button"
              onClick={addTaxComponent}
              disabled={!taxInclusive || taxComponents.length >= 2}
              className={`px-2 py-1 rounded ${
                !taxInclusive || taxComponents.length >= 2
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-cyan-700"
              }`}
              title={
                taxInclusive
                  ? "Add tax component"
                  : "Disabled in exclusive mode"
              }
            >
              + Add Tax Component
            </button>
          </div>

          {/* Tax component rows */}
          {taxComponents.length > 0 && (
            <div
              className={`inline-block text-left border rounded-md p-2 ${
                taxInclusive
                  ? "bg-white border-gray-200"
                  : "bg-gray-100 border-gray-200 opacity-70"
              }`}
            >
              {taxComponents.map((tc, i) => (
                <div key={i} className="flex items-center gap-2 my-1">
                  <input
                    type="text"
                    className="border bg-white border-gray-300 p-1 rounded text-sm"
                    placeholder="Tax component name"
                    value={tc.name}
                    onChange={(e) =>
                      updateTaxComponent(i, { name: e.target.value })
                    }
                    disabled={!taxInclusive}
                  />
                  <input
                    type="number"
                    className="border bg-white border-gray-300 p-1 rounded text-sm w-24"
                    placeholder="%"
                    step={0.01}
                    min={0}
                    value={Number.isFinite(tc.percentage) ? tc.percentage : 0}
                    onChange={(e) =>
                      updateTaxComponent(i, {
                        percentage: Number(e.target.value),
                      })
                    }
                    disabled={!taxInclusive}
                  />
                  <button
                    type="button"
                    className="text-red-600 px-2 py-1"
                    title="Remove component"
                    onClick={() => removeTaxComponent(i)}
                    disabled={!taxInclusive}
                  >
                    ✕
                  </button>

                  {/* Post fields (server ignores in exclusive mode) */}
                  <input
                    type="hidden"
                    name="taxComponentName"
                    value={tc.name}
                  />
                  <input
                    type="hidden"
                    name="taxComponentPct"
                    value={String(tc.percentage)}
                  />
                </div>
              ))}

              {/* Helper hint when sum != 100 */}
              {taxInclusive && !taxComponentsValid && (
                <div className="text-xs text-amber-700 mt-1">
                  Please split tax components to total exactly <b>100%</b>.
                </div>
              )}
            </div>
          )}

          <div className="text-lg font-bold">
            Total (incl. tax):{" "}
            <span className="font-mono">
              {taxInclusive
                ? formatMoney(totals.incl, currency)
                : formatMoney(totals.excl, currency)}
            </span>
          </div>

          {/* Additional Charges (only one) */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={addAdditionalCharges}
              disabled={!!additionalCharges}
              className={`px-2 py-1 rounded ${
                additionalCharges
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-cyan-700"
              }`}
            >
              Add Other Charges
            </button>
          </div>

          {additionalCharges && (
            <div className="inline-block text-left border rounded-md p-2 bg-white border-gray-200">
              <div className="flex items-center gap-2 my-1">
                <input
                  type="text"
                  className="border bg-white border-gray-300 p-1 rounded text-sm"
                  placeholder="Charge name"
                  value={additionalCharges.name}
                  onChange={(e) =>
                    setAdditionalCharges({
                      ...additionalCharges,
                      name: e.target.value,
                    })
                  }
                />
                <input
                  type="number"
                  className="border bg-white border-gray-300 p-1 rounded text-sm w-28"
                  placeholder="Amount"
                  step={0.01}
                  min={0}
                  value={
                    Number.isFinite(additionalCharges.amount)
                      ? additionalCharges.amount
                      : 0
                  }
                  onChange={(e) =>
                    setAdditionalCharges({
                      ...additionalCharges,
                      amount: Number(e.target.value),
                    })
                  }
                />
                <button
                  type="button"
                  className="text-red-600 px-2 py-1"
                  title="Remove other charges"
                  onClick={removeAdditionalCharges}
                >
                  ✕
                </button>

                {/* Post fields */}
                <input
                  type="hidden"
                  name="additionalChargeName"
                  value={additionalCharges.name}
                />
                <input
                  type="hidden"
                  name="additionalChargeAmount"
                  value={String(additionalCharges.amount)}
                />
              </div>
            </div>
          )}

          {/* Grand Total */}
          <div className="text-xl font-extrabold">
            Grand Total:{" "}
            <span className="font-mono">
              {formatMoney(totals.grand, currency)}
            </span>
          </div>
        </div>

        {/* Form actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addRow}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            + Add Item
          </button>
          <button
            type="submit"
            className={`px-4 py-2 rounded font-semibold ${
              taxInclusive && !taxComponentsValid
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-cyan-400 hover:bg-cyan-500 text-white"
            }`}
            disabled={taxInclusive && !taxComponentsValid}
            title={
              taxInclusive && !taxComponentsValid
                ? "Tax components must sum to exactly 100%"
                : "Create Order"
            }
          >
            Create Order
          </button>
        </div>

        <h3 className="text-sm md:text-base font-light mb-2 italic">
          Unit price is <b>always without tax</b>. Toggle “Inclusive” to apply
          tax in totals and enable tax components; toggle “Exclusive” to omit
          tax entirely. In inclusive mode, the tax components must split to{" "}
          <b>exactly 100%</b>.
        </h3>
      </form>
    </div>
  );
}
``;
