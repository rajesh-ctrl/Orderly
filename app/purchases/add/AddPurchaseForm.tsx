// app/purchases/add/AddPurchaseForm.tsx
"use client";

import { useMemo, useState } from "react";
import { addPurchase } from "../purchase";

type Product = {
  id: number;
  name: string;
  price: number;
  taxRatePct: number;
  currency: string;
  sku: string;
  HSN: string;
};

type Supplier = { id: number; name: string };
type Contact = { id: number; name: string; supplierId: number | null };

type TaxComponent = { name: string; percentage: number };
type AdditionalCharges = { name: string; amount: number };

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

export default function AddPurchaseForm({
  products,
  suppliers,
  contacts,
}: {
  products: Product[];
  suppliers: Supplier[];
  contacts: Contact[];
}) {
  // Header
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [supplierQuery, setSupplierQuery] = useState<string>("");
  const [supplierOpen, setSupplierOpen] = useState<boolean>(false);

  const [contactId, setContactId] = useState<number | "">("");
  const [contactQuery, setContactQuery] = useState<string>("");
  const [contactOpen, setContactOpen] = useState<boolean>(false);

  const [currency, setCurrency] = useState<string>("INR");
  const [status, setStatus] = useState<string>("Pending");
  const [reference, setReference] = useState<string>(""); // PO No (optional)

  // Items
  const [items, setItems] = useState<
    {
      productId: number | "";
      query: string;
      quantity: number;
      unitPrice: number; // EXCL tax
      taxPct: number;
      open: boolean;
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

  // Tax components & Other charges
  const [taxComponents, setTaxComponents] = useState<TaxComponent[]>([]);
  const [additionalCharges, setAdditionalCharges] =
    useState<AdditionalCharges | null>(null);

  // Helpers
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

  const filterSuppliers = (q: string) => {
    const x = (q || "").trim().toLowerCase();
    if (!x) return suppliers;
    return suppliers.filter((s) => s.name.toLowerCase().includes(x));
  };

  const filteredContacts = useMemo(() => {
    if (!supplierId || typeof supplierId !== "number") return [];
    return contacts.filter((c) => c.supplierId === supplierId);
  }, [contacts, supplierId]);

  const filterContacts = (q: string) => {
    const x = (q || "").trim().toLowerCase();
    const list = filteredContacts;
    if (!x) return list;
    return list.filter((c) => c.name.toLowerCase().includes(x));
  };

  // Item handlers
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
          row.taxPct = Number(p.taxRatePct); // default tax
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

  // Tax components (max 2, optional; sum doesn’t need to be 100 if your policy differs)
  const addTaxComponent = () => {
    if (taxComponents.length >= 2) return;
    const defaultPct = taxComponents.length === 0 ? 100 : 50;
    setTaxComponents((prev) => [...prev, { name: "", percentage: defaultPct }]);
  };
  const updateTaxComponent = (idx: number, patch: Partial<TaxComponent>) =>
    setTaxComponents((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, ...patch } : t))
    );
  const removeTaxComponent = (idx: number) =>
    setTaxComponents((prev) => prev.filter((_, i) => i !== idx));

  // Additional charges (single)
  const addAdditionalCharges = () => {
    if (!additionalCharges) setAdditionalCharges({ name: "", amount: 0 });
  };
  const removeAdditionalCharges = () => setAdditionalCharges(null);

  // Totals preview
  const totals = useMemo(() => {
    let base = 0;
    let tax = 0;
    for (const row of items) {
      if (!row.productId || typeof row.productId !== "number") continue;
      const qty = Number(row.quantity);
      const rate = (Number(row.taxPct) || 0) / 100;
      const lineBase = round2(Number(row.unitPrice) * qty); // EXCL tax
      base += lineBase;
      tax += round2(lineBase * rate);
    }
    const incl = round2(base + tax);
    const grand = round2(incl + (additionalCharges?.amount || 0));
    return { base: round2(base), tax: round2(tax), incl, grand };
  }, [items, additionalCharges]);

  // Rendering
  return (
    <div className="p-4 md:p-6 w-full max-w-8xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-2">
        Create Purchase Order
      </h1>
      <h3 className="text-sm md:text-base font-light mb-6">
        Record a new Purchase Order to update stock and accounts
      </h3>

      {/* IMPORTANT: no onSubmit prop — rely on action={addPurchase} */}
      <form
        action={addPurchase}
        className="flex flex-col gap-4 bg-gray-50 p-4 rounded shadow"
      >
        {/* Supplier / Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supplier combobox */}
          <div className="relative">
            <span className="block text-sm text-gray-700 mb-1">Supplier</span>
            <input
              type="text"
              className="w-full border bg-white border-gray-300 p-2 rounded text-sm md:text-base"
              value={supplierQuery}
              onFocus={() => setSupplierOpen(true)}
              onChange={(e) => setSupplierQuery(e.target.value)}
              placeholder="Type to search by name..."
              required
            />
            {supplierOpen && (
              <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto border border-gray-300 bg-white rounded shadow">
                {filterSuppliers(supplierQuery).length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No matches
                  </div>
                ) : (
                  filterSuppliers(supplierQuery).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSupplierId(s.id);
                        setSupplierQuery(s.name);
                        setSupplierOpen(false);
                        setContactId("");
                        setContactQuery("");
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      {s.name}
                    </button>
                  ))
                )}
              </div>
            )}
            {supplierId && (
              <input
                type="hidden"
                name="supplierId"
                value={String(supplierId)}
              />
            )}
          </div>

          {/* Contact combobox (supplier-scoped) */}
          <div className="relative">
            <span className="block text-sm text-gray-700 mb-1">Contact</span>
            <input
              type="text"
              className="w-full border bg-white border-gray-300 p-2 rounded text-sm md:text-base"
              value={contactQuery}
              onFocus={() => setContactOpen(true)}
              onChange={(e) => setContactQuery(e.target.value)}
              placeholder="Type to search contact..."
              disabled={!supplierId}
            />
            {contactOpen && (
              <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto border border-gray-300 bg-white rounded shadow">
                {filterContacts(contactQuery).length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No matches
                  </div>
                ) : (
                  filterContacts(contactQuery).map((ct) => (
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

        {/* Currency / Status / Reference */}
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
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="AED">AED</option>
              <option value="SGD">SGD</option>
              <option value="AUD">AUD</option>
              <option value="CAD">CAD</option>
              <option value="JPY">JPY</option>
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
              <option value="Posted">Posted</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">PO Reference</span>
            <input
              type="text"
              name="reference"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Optional"
            />
          </label>
        </div>

        {/* Line Items */}
        <div className="space-y-3">
          {items.map((row, index) => {
            const p = getProduct(row.productId);
            const list = filterProducts(row.query);
            const lineTotalExcl = round2(
              Number(row.unitPrice) * Number(row.quantity)
            );

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

                  {/* Minimal context */}
                  {p && (
                    <div className="mt-1 text-[11px] text-gray-600">
                      <span>
                        Catalog: {formatMoney(Number(p.price), currency)}
                      </span>
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

        {/* Totals / Controls */}
        <div className="text-right space-y-1">
          <div className="text-base font-semibold">
            Total (excl. tax):{" "}
            <span className="font-mono">
              {formatMoney(totals.base, currency)}
            </span>
          </div>

          <div className="text-sm text-gray-700">
            Total tax:{" "}
            <span className="font-mono">
              {formatMoney(totals.tax, currency)}
            </span>
          </div>

          {/* Tax components */}
          <div className="flex justify-end items-center gap-3">
            <button
              type="button"
              onClick={addTaxComponent}
              disabled={taxComponents.length >= 2}
              className={`px-2 py-1 rounded ${
                taxComponents.length >= 2
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-cyan-700"
              }`}
              title="Add tax component"
            >
              + Add Tax Component
            </button>
          </div>

          {taxComponents.length > 0 && (
            <div className="inline-block text-left border rounded-md p-2 bg-white border-gray-200">
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
                  />
                  <button
                    type="button"
                    className="text-red-600 px-2 py-1"
                    title="Remove component"
                    onClick={() => removeTaxComponent(i)}
                  >
                    ✕
                  </button>

                  {/* Post fields */}
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
            </div>
          )}

          <div className="text-lg font-bold">
            Total (incl. tax):{" "}
            <span className="font-mono">
              {formatMoney(totals.incl, currency)}
            </span>
          </div>

          {/* Additional Charges */}
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

          {/* Hidden fields for header */}
          <input type="hidden" name="reference" value={reference} />
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="currency" value={currency} />

          {/* Actions */}
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
              className="px-4 py-2 rounded font-semibold bg-cyan-400 hover:bg-cyan-500 text-white"
              title="Create Purchase Order"
            >
              Create Purchase Order
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
