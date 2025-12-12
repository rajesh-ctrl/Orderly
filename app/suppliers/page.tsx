// app/suppliers/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth";
import { Pencil, Trash2, CirclePlus } from "lucide-react";
import PaginationClient from "@/components/PaginationClient";
import { deleteSupplier } from "./supplier";

type SearchParams = {
  page?: string;
  q?: string;
  added?: string;
  update?: string;
  delete?: string;
};

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const { appUser } = await requireVerifiedUser();
  if (!appUser.currentOrganisationId) {
    return (
      <div className="pl-9 pb-20">
        <h2 className="text-red-600">No current organisation set</h2>
        <p>Switch to an organisation to view suppliers.</p>
        <div className="mt-4">
          <Link
            href="/org/switch"
            className="inline-flex items-center gap-2 bg-cyan-500 text-white px-3 py-2 rounded"
          >
            Switch Organisation
          </Link>
        </div>
      </div>
    );
  }
  const orgId = appUser.currentOrganisationId!;

  const pageSize = 20;
  const page =
    Number.isFinite(Number(params.page)) && Number(params.page) > 0
      ? Number(params.page)
      : 1;
  const skip = Math.max(0, (page - 1) * pageSize);
  const q = (params.q ?? "").trim();

  const where: any = {
    organisationId: orgId,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { taxNumber: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { contactNumber: { contains: q, mode: "insensitive" } },
            { state: { contains: q, mode: "insensitive" } },
            { country: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [totalSuppliers, suppliers] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        taxNumber: true,
        contactNumber: true,
        email: true,
        address1: true,
        address2: true,
        state: true,
        country: true,
        zipcode: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalSuppliers / pageSize));

  return (
    <div className="pl-9 pb-20">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-gray-200">
        <div className="w-[90%] mx-auto mt-2 mb-3">
          <div className="flex flex-wrap items-start gap-3 justify-between">
            <div className="min-w-[240px]">
              <h1 className="text-xl font-bold pb-1 hidden xl:flex">
                Suppliers
              </h1>
              <p className="text-gray-600 text-xs lg:text-sm hidden xl:flex">
                Manage your suppliers
              </p>
            </div>

            {/* Search form */}
            <form
              action="/suppliers"
              method="GET"
              className="flex items-end gap-2 flex-1 min-w-[280px]"
            >
              <label className="flex flex-col gap-1 w-full">
                <span className="text-xs text-gray-700">Search</span>
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Name, tax no, email, phone, state, country"
                  className="border bg-white border-gray-300 p-2 rounded text-sm font-mono w-full"
                />
              </label>
              <input type="hidden" name="page" value="1" />
              <button
                type="submit"
                className="h-[38px] bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded font-mono text-sm"
              >
                Apply
              </button>
            </form>

            <div className="min-w-[160px] flex justify-end">
              <Link
                href="/suppliers/add"
                className="inline-flex items-center gap-2 border border-gray-300 bg-white shadow-sm hover:bg-gray-100 hover:text-gray-800 h-8 rounded-md px-3 mt-3 text-xs"
              >
                <CirclePlus className="w-5 h-5 text-gray-400 hover:text-cyan-400" />
                New Supplier
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Banners */}
      {params.added === "true" && (
        <div className="mb-4 mt-2 bg-green-100 text-green-800 px-4 py-2 rounded w-[90%] mx-auto">
          ✅ Supplier added successfully!
        </div>
      )}
      {params.update === "true" && (
        <div className="mb-4 mt-2 bg-green-100 text-green-800 px-4 py-2 rounded w-[90%] mx-auto">
          ✅ Supplier updated successfully!
        </div>
      )}
      {params.delete === "true" && (
        <div className="mb-4 mt-2 bg-red-100 text-red-800 px-4 py-2 rounded w-[90%] mx-auto">
          🗑️ Supplier deleted successfully!
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-x-auto p-6 pb-24">
        <table className="table-auto border-collapse border border-gray-300 w-[90%] text-sm font-mono mx-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                ID <span className="text-gray-400 text-xs">int4</span>
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                Name <span className="text-gray-400 text-xs">text</span>
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                Tax No <span className="text-gray-400 text-xs">text</span>
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                Phone <span className="text-gray-400 text-xs">text</span>
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                Email <span className="text-gray-400 text-xs">text</span>
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                Address1 <span className="text-gray-400 text-xs">text</span>
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                Address2 <span className="text-gray-400 text-xs">text</span>
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                State <span className="text-gray-400 text-xs">text</span>
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                Country <span className="text-gray-400 text-xs">text</span>
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                Updated <span className="text-gray-400 text-xs">timestamp</span>
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="font-mono text-sm">
            {suppliers.length === 0 ? (
              <tr>
                <td
                  className="border border-gray-300 px-4 py-2 text-gray-600 italic"
                  colSpan={11}
                >
                  No suppliers found.
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr
                  key={s.id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                >
                  <td className="border border-gray-300 px-4 py-2">{s.id}</td>
                  <td className="border border-gray-300 px-4 py-2">{s.name}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {s.taxNumber ?? ""}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {s.contactNumber ?? ""}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {s.email ?? ""}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {s.address1 ?? ""}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {s.address2 ?? ""}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {s.state ?? ""}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {s.country ?? ""}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(s.updatedAt)
                      .toISOString()
                      .slice(0, 19)
                      .replace("T", " ")}
                  </td>
                  <td className="border border-gray-300 px-2 w-40 text-center">
                    <div className="flex justify-evenly space-x-2">
                      <Link
                        href={`/suppliers/update/${s.id}`}
                        className="inline-flex items-center text-blue-400 hover:bg-blue-100 hover:text-blue-800 p-1 rounded transition relative group"
                      >
                        <Pencil className="w-5 h-5" />
                        <span className="absolute bottom-full ml-6 mt-2 left-full transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                          Edit
                        </span>
                      </Link>
                      <form action={deleteSupplier} className="inline">
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          className="cursor-pointer inline-flex items-center text-gray-400 hover:bg-red-50 hover:text-red-800 p-1 rounded transition relative group"
                        >
                          <Trash2 className="w-5 h-5" />
                          <span className="absolute bottom-full ml-6 mt-2 left-full transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                            Delete
                          </span>
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="w-[90%] mx-auto">
        <PaginationClient currentPage={page} totalPages={totalPages} />
      </div>
    </div>
  );
}
