"use client";

import { useState, useEffect } from "react";
import { addOrder } from "@/lib/actions";

type Product = {
  id: number;
  name: string;
  price: number;
};

export default function AddOrderForm({ products }: { products: Product[] }) {
  const [items, setItems] = useState([
    { productId: "", quantity: 1, sellingPrice: 0 },
  ]);

  const [totalAmount, setTotalAmount] = useState(0);

  // ✅ Calculate total whenever items change
  useEffect(() => {
    const total = items.reduce(
      (sum, item) => sum + Number(item.sellingPrice),
      0
    );
    setTotalAmount(total);
  }, [items]);

  const addRow = () =>
    setItems([...items, { productId: "", quantity: 1, sellingPrice: 0 }]);

  const removeRow = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // ✅ Auto-fill sellingPrice when productId changes
    if (field === "productId") {
      const product = products.find((p) => p.id === Number(value));
      if (product) {
        newItems[index].sellingPrice = product.price; // numeric
        // newItems[index].sellingPrice = product.price * Number(value);
      }
    }

    // update quantity to 1 , when product is changed
    if (field === "productId") {
      const product = products.find((p) => p.id === Number(value));
      if (product) {
        newItems[index].quantity = 1; // numeric
        // newItems[index].sellingPrice = product.price * Number(value);
      }
    }

    // form handling for 0 pricings

    if (field === "quantity" && Number(value) <= 0) {
      alert("Quantity must be greater than zero");
      return;
    }

    if (field === "sellingPrice" && Number(value) <= 0) {
      alert("Price must be greater than zero");
      return;
    }

    // ✅ Auto-update sellingPrice based on quantity
    if (field === "quantity") {
      const product = products.find(
        (p) => p.id === Number(newItems[index].productId)
      );
      if (product) {
        newItems[index].sellingPrice = product.price * Number(value);
      }
    }

    setItems(newItems);
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-2xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-4">Add Order</h1>
      <h3 className="text-sm md:text-base font-light mb-6">
        Register new order to generate invoice
      </h3>
      <form
        action={addOrder}
        className="flex flex-col gap-4 bg-gray-50 p-4 rounded shadow"
      >
        {/* Customer Name */}
        <input
          type="text"
          name="customerName"
          placeholder="Customer Name"
          className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
          required
        />

        {/* Status */}
        <select
          name="status"
          className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
        >
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        {/* Dynamic Product Rows */}
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              {/* Product Dropdown */}
              <select
                name="productId"
                className="border bg-white border-gray-300 p-2 rounded text-sm md:text-base w-2/4"
                value={item.productId}
                onChange={(e) => updateItem(index, "productId", e.target.value)}
                required
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{p.price})
                  </option>
                ))}
              </select>

              {/* Product Dropdown */}
              <select
                name="productPID"
                className="border bg-white border-gray-300 p-2 rounded text-sm md:text-base w-1/4"
                value={item.productId}
                onChange={(e) => updateItem(index, "productId", e.target.value)}
                required
                disabled={!!item.productId}
              >
                <option value="">PID</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} PID
                  </option>
                ))}
              </select>

              {/* // Unit Price calu               */}
              <div className="text-left text-sm font-light">
                per pc ₹{(item.sellingPrice / item.quantity).toFixed(2)}
              </div>

              {/* Quantity */}
              <input
                type="number"
                name="quantity"
                placeholder="Qty"
                className="border bg-white border-gray-300 p-2 rounded text-sm md:text-base w-1/4"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, "quantity", Number(e.target.value))
                }
                required
                disabled={!item.productId} // ✅ Disable until product selected
              />

              {/* Selling Price */}
              <input
                type="number"
                name="sellingPrice"
                placeholder="Price"
                className="border bg-white border-gray-300 p-2 rounded text-sm md:text-base w-1/4"
                step="10"
                value={item.sellingPrice}
                onChange={(e) =>
                  updateItem(index, "sellingPrice", Number(e.target.value))
                }
                required
              />
              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeRow(index)}
                title="Remove Item"
                className="mt-2 relative bg-gray-100 hover:bg-gray-200 text-red-500 w-8 h-8 justify-center rounded-full border border-gray-300 flex items-center shadow-sm transition duration-200"
              >
                <span className="text-red-500 font-bold text-xl">−</span>
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="text-right text-lg font-bold">
          Total: ₹{totalAmount.toFixed(2)}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="bg-gray-200 hover:bg-gray-300 py-2 rounded"
        >
          + Add Item
        </button>

        <button
          type="submit"
          className="bg-cyan-400 hover:bg-cyan-500 text-white py-2 rounded font-semibold"
        >
          Create Order
        </button>

        <h3 className="text-sm md:text-base font-light mb-6 italic">
          No changes are allowed to the line items after submission
        </h3>
      </form>
    </div>
  );
}
