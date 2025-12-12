// app/contacts/update/[id]/page.tsx
import { getContactById, updateContact } from "../../contact";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contactId = Number(id);
  if (!Number.isFinite(contactId) || contactId <= 0) {
    return (
      <div className="p-6 w-full pl-20 pt-10">
        <h1 className="text-2xl font-bold mb-2">Edit Contact</h1>
        <p className="text-red-600">Invalid contact id.</p>
      </div>
    );
  }

  const contact = await getContactById(contactId);
  const { appUser } = await requireVerifiedUser();

  if (!appUser.currentOrganisationId) {
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

  const defaultLinkType = contact.customer
    ? "customer"
    : contact.supplier
    ? "supplier"
    : "customer";

  const defaultLinkId =
    contact.customer?.id ??
    contact.supplier?.id ??
    customers[0]?.id ??
    suppliers[0]?.id ??
    0;

  return (
    <div className="p-4 md:p-6 w-full md:pl-20 pt-8">
      <h1 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">
        Edit Contact
      </h1>
      <h3 className="text-sm md:text-base font-light mb-6 text-gray-700">
        Update the contact details
      </h3>

      <form
        action={updateContact}
        className="w-full max-w-lg flex flex-col gap-6 p-4 rounded-md bg-gray-50 shadow-sm"
      >
        <input type="hidden" name="id" value={String(contact.id)} />

        <label className="flex flex-col gap-2">
          <span className="text-sm text-gray-700">Name</span>
          <input
            name="name"
            defaultValue={contact.name ?? ""}
            className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            required
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Contact Number</span>
            <input
              name="contactNumber"
              defaultValue={contact.contactNumber ?? ""}
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Email</span>
            <input
              type="email"
              name="email"
              defaultValue={contact.email ?? ""}
              className="border bg-white border-gray-300 p-2 rounded w-full text-sm md:text-base"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Link Type</span>
            <select
              name="linkType"
              defaultValue={defaultLinkType}
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
              defaultValue={defaultLinkId}
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
          Update
        </button>
        <p className="text-gray-600 text-sm italic">
          Please check the data before submission!
        </p>
      </form>
    </div>
  );
}
