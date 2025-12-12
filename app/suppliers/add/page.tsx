// app/suppliers/add/page.tsx
import { addSupplier } from "../supplier";
import { requireVerifiedUser } from "@/lib/auth";

export default async function AddSupplierPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { appUser } = await requireVerifiedUser();

  return (
    <div className="p-4 md:p-6 w-full md:pl-20 pt-8">
      <h1 className="text-xl md:text-2xl font-bold mb-2">Add Supplier</h1>
      <h3 className="text-sm md:text-base font-light mb-1">
        Register a new supplier to the current organisation
      </h3>
      <p className="text-xs text-gray-500 mb-6">
        Current org:&nbsp;
        <span className="font-mono">
          {appUser.currentOrganisationId ?? "(none)"}
        </span>
      </p>

      {params?.error && (
        <p className="text-red-600 text-sm mb-4">{params.error}</p>
      )}

      <form
        action={addSupplier}
        className="w-full max-w-lg flex flex-col gap-6 p-4 rounded-md bg-gray-50 shadow-sm"
      >
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-700">Name</span>
          <input
            name="name"
            className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            required
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Tax Number</span>
            <input
              name="taxNumber"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Contact Number</span>
            <input
              name="contactNumber"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-700">Email</span>
          <input
            type="email"
            name="email"
            className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-700">Address Line 1</span>
          <input
            name="address1"
            className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
          />
        </label>

        {/* NEW: Address Line 2 */}
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-700">Address Line 2</span>
          <input
            name="address2"
            className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">State</span>
            <input
              name="state"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Country</span>
            <input
              name="country"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Zip Code</span>
            <input
              name="zipcode"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-cyan-400 hover:bg-cyan-500 py-2 mt-1 text-white font-semibold border rounded cursor-pointer disabled:opacity-60 text-sm md:text-base"
        >
          Add Supplier
        </button>

        <p className="text-gray-600 text-sm italic">
          Make sure the supplier is not already available!
        </p>
      </form>
    </div>
  );
}
