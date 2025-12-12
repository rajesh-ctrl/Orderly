// app/products/page.tsx
// app/products/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth";
import { Pencil, Trash2, PackageOpen } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { deleteProduct } from "./product";

/** In App Router Server Components, searchParams is delivered as a Promise */
type ProductsPageProps = {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
    sort?: string;
    dir?: "asc" | "desc";
    error?: string;
    added?: string;
    update?: string;
    delete?: string;
  }>;
};

// Whitelist sortable columns so dynamic orderBy stays type-safe
const SORTABLE: Array<keyof Prisma.ProductOrderByWithRelationInput> = [
  "name",
  "sku",
  "HSN",
  "transferprice",
  "price",
  "stock",
  "currency",
  "taxRatePct",
  "organisationId",
  "userId",
  "updatedAt",
  "createdAt",
];

function makeOrderBy<K extends keyof Prisma.ProductOrderByWithRelationInput>(
  key: K,
  direction: "asc" | "desc"
): Prisma.ProductOrderByWithRelationInput {
  return { [key]: direction } as Prisma.ProductOrderByWithRelationInput;
}

// Per-row currency formatter
function formatMoney(value: unknown, currency: string) {
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : Number((value as any)?.toString?.() ?? value);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(Number.isFinite(num) ? num : 0);
  } catch {
    // Fallback if currency code is invalid
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number.isFinite(num) ? num : 0);
  }
}

function SortArrow({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  // Use simple Unicode arrows to keep the table clean and mono
  if (!active) {
    return <span className="ml-1 text-gray-300">↕</span>;
  }
  return (
    <span className="ml-1">
      {dir === "asc" ? (
        <span className="text-gray-500">▲</span>
      ) : (
        <span className="text-gray-500">▼</span>
      )}
    </span>
  );
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  // ✅ unwrap the Promise first
  const params = await searchParams;

  // Auth + DB sync (first visit creates personal default org if needed)
  const { stackUser, appUser } = await requireVerifiedUser();

  // Guard: must have a current org to show products
  const currentOrgId = appUser.currentOrganisationId;
  if (!currentOrgId) {
    return (
      <div className="pl-9 pb-20">
        <h2 className="text-red-600">No current organisation set</h2>
        <p>Switch to an organisation to view products.</p>
        <div className="mt-4">
          <Link
            className="inline-flex items-center gap-2 bg-cyan-500 text-white px-3 py-2 rounded"
            href="/org/switch"
          >
            <PackageOpen className="w-4 h-4" />
            Switch Organisation
          </Link>
        </div>
      </div>
    );
  }

  // ---- Paging & optional search/sort ----
  const pageSizeRaw = Number(params.pageSize ?? 10);
  const pageSize =
    Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : 10;

  const pageNumRaw = Number(params.page ?? 1);
  const page = Number.isFinite(pageNumRaw) && pageNumRaw > 0 ? pageNumRaw : 1;
  const skip = Math.max(0, (page - 1) * pageSize);

  const q = (params.q ?? "").trim();
  const sortParam = (params.sort ?? "updatedAt") as string;
  const sortKey = (
    SORTABLE.includes(sortParam as any) ? sortParam : "updatedAt"
  ) as keyof Prisma.ProductOrderByWithRelationInput;
  const dir: "asc" | "desc" = params.dir === "asc" ? "asc" : "desc";
  const orderBy = makeOrderBy(sortKey, dir);

  // Filter: org + simple search across name/sku
  const where: Prisma.ProductWhereInput = {
    organisationId: currentOrgId,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [totalProducts, products, currentOrg] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      select: {
        id: true,
        organisationId: true,
        userId: true,
        name: true,
        stock: true,
        sku: true,
        HSN: true,
        transferprice: true,
        price: true, // Prisma.Decimal
        currency: true,
        taxRatePct: true, // Prisma.Decimal
        createdByEmail: true,
        updatedByEmail: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.organisation.findUnique({
      where: { id: currentOrgId },
      select: { ownerOrgUserId: true, name: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const displayName =
    (stackUser as any).displayName ?? stackUser.name ?? "User";
  const isOwner = currentOrg?.ownerOrgUserId === appUser.id;

  // Helpers to preserve query params in pagination & sorting links
  const withParams = (pageTarget: number) => {
    const qp = new URLSearchParams();
    qp.set("page", String(pageTarget));
    qp.set("pageSize", String(pageSize));
    if (q) qp.set("q", q);
    if (sortParam) qp.set("sort", sortParam);
    if (dir) qp.set("dir", dir);
    return `/products?${qp.toString()}`;
  };
  const withSort = (newSort: string) => {
    const qp = new URLSearchParams();
    qp.set("page", "1");
    qp.set("pageSize", String(pageSize));
    if (q) qp.set("q", q);
    qp.set("sort", newSort);
    const nextDir =
      sortParam === newSort ? (dir === "asc" ? "desc" : "asc") : "asc";
    qp.set("dir", nextDir);
    return `/products?${qp.toString()}`;
  };

  return (
    <div className="pl-9 pb-20">
      {/* Header */}
      <div className="mb-4">
        <h2 className="font-semibold font-mono">{displayName}</h2>
        <p className="text-sm text-gray-600">
          User ID:&nbsp;<span className="font-mono">{appUser.id}</span>
        </p>
        <p className="text-sm text-gray-600">
          Current Org:&nbsp;<span className="font-mono">{currentOrgId}</span>
          {currentOrg?.name ? ` (${currentOrg.name})` : ""}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        {isOwner && (
          <Link
            className="inline-flex items-center gap-2 bg-cyan-400 text-white px-3 py-2 rounded"
            href="/members"
          >
            <PackageOpen className="w-4 h-4" />
            Members
          </Link>
        )}
        <Link
          className="inline-flex items-center gap-2 bg-cyan-500 text-white px-3 py-2 rounded"
          href="/products/add"
        >
          <PackageOpen className="w-4 h-4" />
          Add Product
        </Link>

        {/* Search form */}
        <form className="ml-auto flex gap-2" action="/products" method="GET">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search name or SKU"
            className="border p-2 rounded font-mono text-sm"
          />
          {/* Keep sort, dir & pageSize when searching */}
          <input type="hidden" name="sort" value={sortParam} />
          <input type="hidden" name="dir" value={dir} />
          <input type="hidden" name="pageSize" value={String(pageSize)} />
          <button
            type="submit"
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded font-mono text-sm"
          >
            Search
          </button>
        </form>
      </div>

      {params.added === "true" && (
        <div className="mb-4 mt-4 bg-green-100 text-green-800 px-4 py-2 rounded w-[90%]">
          ✅ Product added successfully!
        </div>
      )}
      {params.update === "true" && (
        <div className="mb-4 mt-4 bg-green-100 text-green-800 px-4 py-2 rounded w-[90%]">
          ✅ Product updated successfully!
        </div>
      )}
      {params.delete === "true" && (
        <div className="mb-4 mt-4 bg-red-100 text-red-800 px-4 py-2 rounded w-[90%]">
          🗑️ Product deleted successfully! Cannot be retrieved!!
        </div>
      )}
      {/* Error banner from querystring */}
      {params.error && (
        <p className="text-red-600 text-sm mb-4 font-mono">{params.error}</p>
      )}

      {/* TABLE */}
      <table className="table-auto border-collapse border border-gray-300 w-[100%] text-sm font-mono">
        <thead className="bg-gray-50">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
              ID <span className="text-gray-400 text-xs">int4</span>
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
              <Link href={withSort("name")} className="hover:underline">
                Name
              </Link>{" "}
              <span className="text-gray-400 text-xs">text</span>
              <SortArrow active={sortKey === "name"} dir={dir} />
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
              <Link href={withSort("sku")} className="hover:underline">
                SKU
              </Link>{" "}
              <span className="text-gray-400 text-xs">text</span>
              <SortArrow active={sortKey === "sku"} dir={dir} />
            </th>
            {/* HSN */}
            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
              <Link href={withSort("HSN")} className="hover:underline">
                HSN
              </Link>{" "}
              <span className="text-gray-400 text-xs">text</span>
              <SortArrow active={sortKey === "HSN"} dir={dir} />
            </th>
            {/* Transfer Price */}
            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
              <Link
                href={withSort("transferprice")}
                className="hover:underline"
              >
                Transfer Price
              </Link>{" "}
              <span className="text-gray-400 text-xs">numeric</span>
              <SortArrow active={sortKey === "transferprice"} dir={dir} />
            </th>
            {/* Price */}
            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
              <Link href={withSort("price")} className="hover:underline">
                Price
              </Link>{" "}
              <span className="text-gray-400 text-xs">numeric</span>
              <SortArrow active={sortKey === "price"} dir={dir} />
            </th>
            {/* Stock */}
            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
              <Link href={withSort("stock")} className="hover:underline">
                Stock
              </Link>{" "}
              <span className="text-gray-400 text-xs">int4</span>
              <SortArrow active={sortKey === "stock"} dir={dir} />
            </th>
            {/* Currency */}
            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
              <Link href={withSort("currency")} className="hover:underline">
                Currency
              </Link>{" "}
              <span className="text-gray-400 text-xs">text</span>
              <SortArrow active={sortKey === "currency"} dir={dir} />
            </th>
            {/* Tax % */}
            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
              <Link href={withSort("taxRatePct")} className="hover:underline">
                Tax %
              </Link>{" "}
              <span className="text-gray-400 text-xs">numeric</span>
              <SortArrow active={sortKey === "taxRatePct"} dir={dir} />
            </th>
            {/* Org ID / User ID */}
            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
              <Link
                href={withSort("organisationId")}
                className="hover:underline"
              >
                Org ID
              </Link>{" "}
              <span className="text-gray-400 text-xs">text</span>
              <SortArrow active={sortKey === "organisationId"} dir={dir} />
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
              <Link href={withSort("userId")} className="hover:underline">
                User ID
              </Link>{" "}
              <span className="text-gray-400 text-xs">text</span>
              <SortArrow active={sortKey === "userId"} dir={dir} />
            </th>
            {/* Updated By / Created By */}
            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
              Updated By <span className="text-gray-400 text-xs">text</span>
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
              Created By <span className="text-gray-400 text-xs">text</span>
            </th>
            {/* Updated / Created timestamps */}
            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
              <Link href={withSort("updatedAt")} className="hover:underline">
                Updated
              </Link>{" "}
              <span className="text-gray-400 text-xs">timestamp</span>
              <SortArrow active={sortKey === "updatedAt"} dir={dir} />
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
              <Link href={withSort("createdAt")} className="hover:underline">
                Created
              </Link>{" "}
              <span className="text-gray-400 text-xs">timestamp</span>
              <SortArrow active={sortKey === "createdAt"} dir={dir} />
            </th>
            {/* Actions */}
            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="font-mono text-sm">
          {products.length === 0 ? (
            <tr>
              <td
                className="border border-gray-300 px-4 py-2 text-gray-600 italic"
                colSpan={16}
              >
                No products in this organisation yet.
              </td>
            </tr>
          ) : (
            products.map((p) => (
              <tr
                key={p.id}
                className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
              >
                <td className="border border-gray-300 px-4 py-2">{p.id}</td>
                <td className="border border-gray-300 px-4 py-2">{p.name}</td>
                <td className="border border-gray-300 px-4 py-2 font-mono">
                  {p.sku}
                </td>
                <td className="border border-gray-300 px-4 py-2">{p.HSN}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {formatMoney(p.transferprice, p.currency)}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {formatMoney(p.price, p.currency)}
                </td>
                <td className="border border-gray-300 px-4 py-2">{p.stock}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {p.currency}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {Number(p.taxRatePct).toFixed(2)}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {p.organisationId}
                </td>
                <td className="border border-gray-300 px-4 py-2">{p.userId}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {p.updatedByEmail}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {p.createdByEmail}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {new Date(p.updatedAt)
                    .toISOString()
                    .slice(0, 19)
                    .replace("T", " ")}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {new Date(p.createdAt)
                    .toISOString()
                    .slice(0, 19)
                    .replace("T", " ")}
                </td>

                {/* Actions with icons + tooltips */}
                <td className="border border-gray-300 px-2 w-40 text-center">
                  <div className="flex justify-evenly space-x-2">
                    {/* Edit */}
                    <Link
                      href={`/products/update/${p.id}`}
                      className="inline-flex items-center text-blue-400 hover:bg-blue-100 hover:text-blue-800 p-1 rounded transition relative group"
                    >
                      <Pencil className="w-5 h-5" />
                      <span className="absolute bottom-full ml-6 mt-2 left-full transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                        Edit
                      </span>
                    </Link>

                    {/* Delete (posts to server action) */}
                    <form action={deleteProduct} className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="cursor-pointer inline-flex items-center text-gray-400 hover:bg-red-50 hover:text-red-800 p-1 rounded transition relative group"
                      >
                        <Trash2 className="w-5 h-5" />
                        {/* Tooltip */}
                        <span className="absolute bottom-full  ml-6 mt-2 left-full transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition">
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

      {/* Pagination */}
      <div className="mt-6 flex items-center gap-3">
        <span className="text-sm text-gray-600 font-mono">
          Page {page} / {totalPages} · {totalProducts} items
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              className="px-3 py-1 bg-gray-200 rounded font-mono"
              href={withParams(page - 1)}
            >
              Prev
            </Link>
          )}
          {page < totalPages && (
            <Link
              className="px-3 py-1 bg-gray-200 rounded font-mono"
              href={withParams(page + 1)}
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
