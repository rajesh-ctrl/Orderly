// app/products/update/[id]/page.tsx
import { getProductById, updateProduct } from "../../product";

type PageProps = {
  // ✅ In your Next.js version, params is a Promise
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: PageProps) {
  // ✅ Unwrap the promise first
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isFinite(productId) || productId <= 0) {
    return (
      <div className="p-6 w-full pl-20 pt-10">
        <h1 className="text-2xl font-bold mb-2">Edit Product</h1>
        <p className="text-red-600">Invalid product id.</p>
      </div>
    );
  }

  const product = await getProductById(productId);

  if (!product) {
    return (
      <div className="p-6 w-full pl-20 pt-10">
        <h1 className="text-2xl font-bold mb-2">Edit Product</h1>
        <p className="text-red-600">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full md:pl-20 pt-8">
      <h1 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">
        Edit Product
      </h1>
      <h3 className="text-sm md:text-base font-light mb-6 text-gray-700">
        Update the product details in the database
      </h3>

      <form
        action={updateProduct}
        className="w-full max-w-lg flex flex-col gap-6 p-4 rounded-md bg-gray-50 shadow-sm"
      >
        <input type="hidden" name="id" value={String(product.id)} />

        {/* SKU (locked) */}
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-700">SKU</span>
          <input
            type="text"
            name="sku"
            placeholder="SKU"
            defaultValue={product.sku ?? ""}
            className="border bg-gray border-gray-300 p-2 rounded w-full text-sm md:text-base text-gray-900"
            disabled
          />
        </label>

        {/* HSN (locked) */}
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-700">HSN</span>
          <input
            type="text"
            name="hsn"
            placeholder="HSN"
            defaultValue={product.HSN ?? ""}
            className="border bg-gray border-gray-300 p-2 rounded w-full text-sm md:text-base text-gray-900"
            disabled
          />
        </label>

        {/* Product Name */}
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-700">Product Name</span>
          <input
            type="text"
            name="name"
            placeholder="Product Name"
            defaultValue={product.name ?? ""}
            className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base text-gray-900"
            required
          />
        </label>

        {/* Currency + Tax % (same as Add page) */}
        <div className="flex flex-col md:flex-row gap-4">
          <label className="flex flex-col gap-2 w-full md:w-1/2">
            <span className="text-sm text-gray-700">Currency</span>
            <select
              name="currency"
              defaultValue={product.currency ?? "INR"}
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
              defaultValue={product.taxRatePct?.toString() ?? ""}
              step="0.01"
              min="0"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base text-gray-900"
              required
            />
          </label>
        </div>

        {/* Transfer Price, Price & Stock */}
        <div className="flex flex-col md:flex-row gap-4">
          <label className="flex flex-col gap-2 w-full md:w-1/3">
            <span className="text-sm text-gray-700">Transfer Price</span>
            <input
              type="number"
              name="transferprice"
              placeholder="Transfer Price"
              defaultValue={product.transferprice?.toString() ?? ""}
              step="1"
              min="1"
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
              defaultValue={product.price?.toString() ?? ""}
              step="1"
              min="1"
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
              defaultValue={product.stock?.toString() ?? ""}
              step="1"
              min="0"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base text-gray-900"
              required
            />
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-cyan-400 hover:bg-cyan-500 py-2 mt-1 text-white font-semibold border rounded cursor-pointer disabled:opacity-60 text-sm md:text-base"
        >
          Update
        </button>

        <p className="text-gray-600 text-sm italic">
          Please check the data before submission!!
        </p>
      </form>
    </div>
  );
}
