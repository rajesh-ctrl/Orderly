"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-cyan-400 hover:bg-cyan-500 text-white py-2 px-4 rounded font-semibold"
    >
      Print Invoice
    </button>
  );
}
