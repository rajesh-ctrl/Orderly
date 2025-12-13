// app/supplieritems/[id]/toolbar.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  poNumber: string;
  supplierName?: string | null;
  relativeUrl: string; // e.g., `/supplieritems/22`
  supplierEmail?: string; // optional
  supplierPhone?: string; // optional (any format)
  orgName?: string;
};

function buildAbsoluteUrl(relativeUrl: string) {
  try {
    return new URL(relativeUrl, window.location.origin).href;
  } catch {
    return relativeUrl;
  }
}

function sanitizePhoneToE164(raw?: string, defaultCountry = "91") {
  if (!raw) return "";
  const digits = String(raw).replace(/\D+/g, ""); // keep digits
  if (!digits) return "";
  // If it already starts with country code (length > 10), assume OK
  if (digits.length > 10) return digits;
  // If local 10-digit (India), prepend defaultCountry
  if (digits.length === 10) return defaultCountry + digits;
  // Otherwise return as-is
  return digits;
}

export default function InvoiceToolbar({
  poNumber,
  supplierName,
  relativeUrl,
  supplierEmail,
  supplierPhone,
  orgName,
}: Props) {
  const url =
    typeof window !== "undefined" ? buildAbsoluteUrl(relativeUrl) : relativeUrl;
  const [paper, setPaper] = useState<"A4" | "Letter">("A4");

  // Title restore is no longer required since we set metadata on the server
  const onPrint = useCallback(() => {
    // Optional: attach chosen paper size on <html> so inline CSS can pick it up if you add rules
    document.documentElement.setAttribute("data-paper", paper);
    window.print();
  }, [paper]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Purchase Order link copied to clipboard");
    } catch {
      alert("Unable to copy link");
    }
  }, [url]);

  const onEmail = useCallback(() => {
    const cust = (supplierName || "Customer").trim();
    const subject = `Purchase Order ${poNumber} - ${cust}`;
    const body =
      `Dear ${cust},%0D%0A%0D%0A` +
      `Please find our Purchase Order attached. %0D%0A%0D%0A` +
      `This is a computer generated PO; signature not required.%0D%0A%0D%0A` +
      `Regards,%0D%0AAccounts Team %0D%0A${orgName} `;
    const to = supplierEmail ? encodeURIComponent(supplierEmail) : "";
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(
      subject
    )}&body=${body}`;
  }, [supplierName, poNumber, url, supplierEmail]);

  const onWhatsApp = useCallback(() => {
    const cust = (supplierName || "Customer").trim();
    const msg =
      `Purchase Order ${poNumber} - ${cust}\n` +
      `${url}\n\n` +
      `This is a computer generated PO; signature not required.`;
    ("${orgName}");
    const phone = sanitizePhoneToE164(supplierPhone, "91"); // default to +91 if local 10 digits
    const encodedMsg = encodeURIComponent(msg);
    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodedMsg}`
      : `https://wa.me/?text=${encodedMsg}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }, [supplierName, poNumber, url, supplierPhone]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-700">Purchase Order Actions</div>
        <label className="text-xs text-gray-600 ml-2">Paper:</label>
        <select
          value={paper}
          onChange={(e) => setPaper(e.target.value as "A4" | "Letter")}
          className="text-xs bsupplier rounded px-2 py-1 bg-white"
        >
          <option value="A4">A4</option>
          <option value="Letter">Letter</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEmail}
          className="px-3 py-2 rounded bsupplier text-sm bg-white hover:bg-gray-50"
          title="Send po link via email"
        >
          Email
        </button>
        <button
          type="button"
          onClick={onWhatsApp}
          className="px-3 py-2 rounded bsupplier text-sm bg-white hover:bg-gray-50"
          title="Send po via WhatsApp"
        >
          WhatsApp
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="px-3 py-2 rounded bsupplier text-sm bg-white hover:bg-gray-50"
          title="Copy po link"
        >
          Copy Link
        </button>
        <button
          type="button"
          onClick={onPrint}
          className="px-3 py-2 rounded text-sm text-white bg-cyan-600 hover:bg-cyan-700"
          title="Print or Save as PDF"
        >
          Print / Save PDF
        </button>
      </div>
    </div>
  );
}
