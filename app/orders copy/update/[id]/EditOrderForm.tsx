// "use client";

import { updateOrderStatus } from "@/lib/actions";
// import React, { useState } from "react";

interface EditOrderFormProps {
  orderId: number;
  initialStatus: string;
  // onSubmit: (data: { orderId: number; status: string }) => Promise<void>;
}

export default function EditOrderForm({
  orderId,
  initialStatus,
}: // onSubmit,
EditOrderFormProps) {
  // const [status, setStatus] = useState(initialStatus);

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   await onSubmit({ orderId, status });
  // };

  return (
    <div className="p-4 md:p-6 w-full max-w-md mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-4">
        Update Order #{orderId}
      </h1>
      <h3 className="text-sm md:text-base font-light mb-6">
        Change order status only
      </h3>

      <form
        action={updateOrderStatus}
        className="flex flex-col gap-4 bg-gray-50 p-4 rounded shadow"
      >
        <input type="hidden" name="orderId" value={orderId} />
        <select
          name="status"
          defaultValue={initialStatus}
          className="border p-2 rounded"
        >
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
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
