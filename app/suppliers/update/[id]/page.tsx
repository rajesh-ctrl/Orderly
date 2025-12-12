// app/suppliers/update/[id]/page.tsx
import { getSupplierById, updateSupplier } from "../../supplier";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplierId = Number(id);

  if (!Number.isFinite(supplierId) || supplierId <= 0) {
    return (
      <div className="p-6 w-full pl-20 pt-10">
        <h1 className="text-2xl font-bold mb-2">Edit Supplier</h1>
        <p className="text-red-600">Invalid supplier id.</p>
      </div>
    );
  }

  const supplier = await getSupplierById(supplierId);
  if (!supplier) {
    return (
      <div className="p-6 w-full pl-20 pt-10">
        <h1 className="text-2xl font-bold mb-2">Edit Supplier</h1>
        <p className="text-red-600">Supplier not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full md:pl-20 pt-8">
      <h1 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">
        Edit Supplier
      </h1>
      <h3 className="text-sm md:text-base font-light mb-6 text-gray-700">
        Update the supplier details
      </h3>

      <form
        action={updateSupplier}
        className="w-full max-w-lg flex flex-col gap-6 p-4 rounded-md bg-gray-50 shadow-sm"
      >
        <input type="hidden" name="id" value={String(supplier.id)} />

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-700">Name</span>
          <input
            name="name"
            defaultValue={supplier.name ?? ""}
            className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            required
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Tax Number</span>
            <input
              name="taxNumber"
              defaultValue={supplier.taxNumber ?? ""}
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Contact Number</span>
            <input
              name="contactNumber"
              defaultValue={supplier.contactNumber ?? ""}
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-700">Email</span>
          <input
            type="email"
            name="email"
            defaultValue={supplier.email ?? ""}
            className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-700">Address Line 1</span>
          <input
            name="address1"
            defaultValue={supplier.address1 ?? ""}
            className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
          />
        </label>

        {/* Address Line 2 */}
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-700">Address Line 2</span>
          <input
            name="address2"
            defaultValue={supplier.address2 ?? ""}
            className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">State</span>
            <input
              name="state"
              defaultValue={supplier.state ?? ""}
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Country</span>
            <input
              name="country"
              defaultValue={supplier.country ?? ""}
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Zip Code</span>
            <input
              name="zipcode"
              defaultValue={supplier.zipcode ?? ""}
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-cyan-400 hover:bg-cyan-500 py-2 mt-1 text-white font-semibold border rounded cursor-pointer disabled:opacity-60 text-sm md:text-base"
        >
          Update
        </button>
        <p className="text-gray-600 text-sm italic">
          Please check the data before submission!
        </p>
      </form>
    </div>
  );
}
