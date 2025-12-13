// app/purchaseitems/[id]/toolbar.tsx
"use client";

import { useCallback } from "react";

export default function InvoiceToolbar() {
  const onPrint = useCallback(() => window.print(), []);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Purchase Order link copied to clipboard");
    } catch {
      alert("Unable to copy link");
    }
  }, []);
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">View / Print Purchase Order</div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="px-3 py-2 rounded border text-sm bg-white hover:bg-gray-50"
        >
          Copy Link
        </button>
        <button
          type="button"
          onClick={onPrint}
          className="px-3 py-2 rounded text-sm text-white bg-cyan-600 hover:bg-cyan-700"
        >
          Print / Save PDF
        </button>
      </div>
    </div>
  );
}
