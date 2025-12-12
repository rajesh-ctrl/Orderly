// app/products/add/page.tsx
import { addProduct } from "../product";
import { requireVerifiedUser } from "@/lib/auth";

export default async function AddProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { appUser } = await requireVerifiedUser();

  return (
    <div className="p-4 md:p-6 w-full md:pl-20 pt-8">
      <h1 className="text-xl md:text-2xl font-bold mb-2">Add Product</h1>
      <h3 className="text-sm md:text-base font-light mb-1">
        Register a new product to the current organisation
      </h3>
      <p className="text-xs text-gray-500 mb-6">
        Current org:&nbsp;
        <span className="font-mono">
          {appUser.currentOrganisationId ?? "(none)"}
        </span>
      </p>

      {/* Error banner */}
      {params?.error && (
        <p className="text-red-600 text-sm mb-4">{params.error}</p>
      )}

      <form
        action={addProduct}
        className="w-full max-w-lg flex flex-col gap-6 p-4 rounded-md bg-gray-50 shadow-sm"
      >
        {/* SKU (editable on create) */}
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-700">SKU</span>
          <input
            type="text"
            name="sku"
            placeholder="SKU (unique)"
            className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base text-gray-900"
            required
          />
        </label>

        {/* HSN (editable on create) */}
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-700">HSN</span>
          <input
            type="text"
            name="hsn"
            placeholder="HSN"
            className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base text-gray-900"
            required
          />
        </label>

        {/* Product Name */}
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-700">Product Name</span>
          <input
            type="text"
            name="name"
            placeholder="Product Name"
            className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base text-gray-900"
            required
          />
        </label>

        {/* Currency + Tax % (same layout as update page) */}
        <div className="flex flex-col md:flex-row gap-4">
          <label className="flex flex-col gap-2 w-full md:w-1/2">
            <span className="text-sm text-gray-700">Currency</span>
            <select
              name="currency"
              defaultValue="INR"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base text-gray-900"
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

          <label className="flex flex-col gap-2 w-full md:w-1/2">
            <span className="text-sm text-gray-700">Tax %</span>
            <input
              type="number"
              name="taxRatePct"
              placeholder="Tax % (e.g., 18)"
              min="0"
              step="0.01"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base text-gray-900"
              required
            />
          </label>
        </div>

        {/* Transfer Price, Price & Stock (same layout as update page) */}
        <div className="flex flex-col md:flex-row gap-4">
          <label className="flex flex-col gap-2 w-full md:w-1/3">
            <span className="text-sm text-gray-700">Transfer Price</span>
            <input
              type="number"
              name="transferprice"
              placeholder="Transfer Price"
              min="1"
              step="1"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base text-gray-900"
              required
            />
          </label>

          <label className="flex flex-col gap-2 w-full md:w-1/3">
            <span className="text-sm text-gray-700">Price</span>
            <input
              type="number"
              name="price"
              placeholder="Price"
              min="1"
              step="1"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base text-gray-900"
              required
            />
          </label>

          <label className="flex flex-col gap-2 w-full md:w-1/3">
            <span className="text-sm text-gray-700">Stock</span>
            <input
              type="number"
              name="stock"
              placeholder="Stock"
              step="1"
              min="1"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base text-gray-900"
              required
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-cyan-400 hover:bg-cyan-500 py-2 mt-1 text-white font-semibold border rounded cursor-pointer disabled:opacity-60 text-sm md:text-base"
        >
          Add Product
        </button>

        <p className="text-gray-600 text-sm italic">
          Make sure the product is not already available!
        </p>
      </form>
    </div>
  );
}
