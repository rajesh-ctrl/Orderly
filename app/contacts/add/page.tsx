// app/contacts/add/page.tsx
import { addContact } from "../contact";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AddContactPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { appUser } = await requireVerifiedUser();

  if (!appUser.currentOrganisationId) {
    // Narrow before using orgId
    redirect("/error?message=No current organisation set");
  }
  const orgId = appUser.currentOrganisationId!;

  const [customers, suppliers] = await Promise.all([
    prisma.customer.findMany({
      where: { organisationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({
      where: { organisationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-4 md:p-6 w-full md:pl-20 pt-8">
      <h1 className="text-xl md:text-2xl font-bold mb-2">Add Contact</h1>
      <h3 className="text-sm md:text-base font-light mb-1">
        Link a contact to a customer or supplier
      </h3>
      <p className="text-xs text-gray-500 mb-6">
        Current org:&nbsp;<span className="font-mono">{orgId}</span>
      </p>

      {params?.error && (
        <p className="text-red-600 text-sm mb-4">{params.error}</p>
      )}

      <form
        action={addContact}
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
            <span className="text-sm text-gray-700">Contact Number</span>
            <input
              name="contactNumber"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Email</span>
            <input
              type="email"
              name="email"
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Link Type</span>
            <select
              name="linkType"
              defaultValue="customer"
              className="border bg-white border-gray-300 p-2 rounded text-sm"
            >
              <option value="customer">Customer</option>
              <option value="supplier">Supplier</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Link To</span>
            <select
              name="linkId"
              className="border bg-white border-gray-300 p-2 rounded text-sm"
              required
            >
              <optgroup label="Customers">
                {customers.map((c) => (
                  <option key={`c-${c.id}`} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Suppliers">
                {suppliers.map((s) => (
                  <option key={`s-${s.id}`} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-cyan-400 hover:bg-cyan-500 py-2 mt-1 text-white font-semibold border rounded cursor-pointer disabled:opacity-60 text-sm md:text-base"
        >
          Add Contact
        </button>

        <p className="text-gray-600 text-sm italic">
          Ensure you select either a customer or supplier correctly.
        </p>
      </form>
    </div>
  );
}
