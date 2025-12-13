// "use client";

import { updatePurchaseStatus } from "../../purchase";
// import React, { useState } from "react";

interface EditPurchaseFormProps {
  purchaseId: number;
  initialStatus: string;

  // onSubmit: (data: { purchaseId: number; status: string }) => Promise<void>;
}

export default function EditPurchaseForm({
  purchaseId,
  initialStatus,
}: // onSubmit,
EditPurchaseFormProps) {
  // const [status, setStatus] = useState(initialStatus);

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   await onSubmit({ purchaseId, status });
  // };

  return (
    <div className="p-4 md:p-6 w-full max-w-md mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-4">
        Update Purchase #{purchaseId}
      </h1>
      <h3 className="text-sm md:text-base font-light mb-6">
        Change purchase status only
      </h3>

      <form
        action={updatePurchaseStatus}
        className="flex flex-col gap-4 bg-gray-50 p-4 rounded shadow"
      >
        <input type="hidden" name="purchaseId" value={purchaseId} />
        <select
          name="status"
          defaultValue={initialStatus}
          className="border p-2 rounded"
        >
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <button
          type="submit"
          className="bg-cyan-400 hover:bg-cyan-500 cursor-pointer text-white py-2 rounded"
        >
          Save Status
        </button>
      </form>
    </div>
  );
}
