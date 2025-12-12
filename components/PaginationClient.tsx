"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function PaginationClient({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputPage, setInputPage] = useState(currentPage);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);

    // ✅ Smooth scroll to top after navigation
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(Number(e.target.value));
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goToPage(inputPage);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-50 text-sm font-semibold  border-t border-gray-200 py-3 flex justify-center items-center gap-2 shadow-sm">
      {/* First Page */}
      <button
        onClick={() => goToPage(1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded border border-gray-200 ${
          currentPage === 1
            ? "text-gray-400 bg-gray-50 "
            : "text-black shadow-xl hover:bg-gray-100  cursor-pointer  "
        }`}
      >
        «
      </button>

      {/* Previous Page */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded border border-gray-200 ${
          currentPage === 1
            ? "text-gray-400 bg-gray-50"
            : "text-black shadow-xl hover:bg-gray-100  cursor-pointer "
        }`}
      >
        ‹
      </button>

      {/* Page Input */}
      <form onSubmit={handleInputSubmit} className="flex items-center gap-2">
        <span className="text-sm text-black">Page</span>

        <input
          type="number"
          value={inputPage}
          onChange={(e) => setInputPage(Number(e.target.value))}
          onBlur={() => goToPage(inputPage)} // ✅ Navigate on blur
          className="border border-gray-200 rounded w-16 text-center py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
          min={1}
          max={totalPages}
        />

        <span className="text-sm text-black">of {totalPages}</span>
      </form>

      {/* Next Page */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded border border-gray-200 ${
          currentPage === totalPages
            ? "text-gray-400 bg-gray-50"
            : "text-black shadow-xl hover:bg-gray-100 cursor-pointer "
        }`}
      >
        ›
      </button>

      {/* Last Page */}
      <button
        onClick={() => goToPage(totalPages)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded border border-gray-200 ${
          currentPage === totalPages
            ? "text-gray-400 bg-gray-50"
            : "text-black shadow-xl hover:bg-gray-100  cursor-pointer  "
        }`}
      >
        »
      </button>
    </div>
  );
}
