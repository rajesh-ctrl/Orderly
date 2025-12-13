import React from "react";

export default function PurchaseInvoiceView({ purchase }: { purchase: any }) {
  const currentDate = new Date().toLocaleDateString("en-IN");
  const purchaseDate = new Date(purchase.createdAt).toLocaleDateString("en-IN");
  const totalAmount = Number(purchase.totalAmount);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="bg-white p-6 rounded shadow">
      {/* Customer & Dates */}
      <div className="flex justify-between mb-6 text-sm">
        <div>
          <p>
            <strong>Purchased From:</strong> {purchase.supplierName}
          </p>
          <p>
            <strong>Purchase Date:</strong> {purchaseDate}
          </p>
        </div>
        <div className="text-right">
          <p>
            <strong>PO Date:</strong> {currentDate}
          </p>
          <p>
            <strong>PO No:</strong> {purchase.poNumber}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full bpurchase bpurchase-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="bpurchase px-3 py-2 text-left font-semibold">
                S.No
              </th>
              <th className="bpurchase px-3 py-2 text-left font-semibold">
                Product Name
              </th>
              <th className="bpurchase px-3 py-2 text-right font-semibold">
                Unit Price
              </th>
              <th className="bpurchase px-3 py-2 text-right font-semibold">
                Quantity
              </th>
              <th className="bpurchase px-3 py-2 text-right font-semibold">
                Total Price
              </th>
            </tr>
          </thead>
          <tbody>
            {purchase.items.map((item: any, index: number) => {
              const unitPrice = Number(item.sellingPrice);
              return (
                <tr key={item.id} className="odd:bg-white even:bg-gray-50">
                  <td className="bpurchase px-3 py-2">{index + 1}</td>
                  <td className="bpurchase px-3 py-2">{item.product.name}</td>
                  <td className="bpurchase px-3 py-2 text-right">
                    {formatCurrency(unitPrice)}
                  </td>
                  <td className="bpurchase px-3 py-2 text-right">
                    {item.quantity}
                  </td>
                  <td className="bpurchase px-3 py-2 text-right">
                    {formatCurrency(unitPrice * item.quantity)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      {/* <div className="bg-gray-100 p-4 rounded mt-6 text-right space-y-2">
        <p className="text-lg font-semibold">
          Subtotal: {formatCurrency(totalAmount)}
        </p>
        <p className="text-sm">
          CGST (9%): {formatCurrency(totalAmount * 0.09)}
        </p>
        <p className="text-sm">
          SGST (9%): {formatCurrency(totalAmount * 0.09)}
        </p>
        <p className="text-xl font-bold">
          Grand Total: {formatCurrency(totalAmount * 1.18)}
        </p>
      </div> */}
    </div>
  );
}
