// app/org/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/auth";

// If all server actions are in orgSwitch.ts:
// import { switchOrg, removeMember, resetToDefaultOrg } from "@/lib/orgSwitch";

// If you split removeMember elsewhere, use:
import { switchOrg, resetToDefaultOrg } from "@/app/org/orgSwitch";
import { removeMember } from "@/app/org/removeMem";

import { regenerateOrgPasskey } from "./orgPasskey";

import {
  Building2,
  KeyRound,
  User2,
  EyeOff,
  PackageOpen,
  ShieldCheck,
  UserMinus,
  Pencil,
  RefreshCcw,
} from "lucide-react";

type SearchParams = {
  orgSwitched?: string;
  updated?: string;
  memberRemoved?: string;
  error?: string;
};

export default async function OrganisationPage({
  searchParams,
}: {
  // In App Router server components, searchParams is a Promise
  searchParams: Promise<SearchParams>;
}) {
  // ✅ Unwrap the promise
  const params = await searchParams;

  // Auth + sync
  const { appUser } = await requireVerifiedUser();

  const currentOrgId = appUser.currentOrganisationId;
  const defaultOrgId = appUser.defaultOrganisationId;

  // If user has no current org, show switch form
  if (!currentOrgId) {
    return (
      <div className="pl-9 pb-20">
        <h2 className="text-red-600 font-semibold">
          No current organisation set
        </h2>
        <p className="text-sm text-gray-700">
          Use the form below to join another organisation.
        </p>
        <div className="mt-4">
          <SwitchOrgForm />
        </div>
      </div>
    );
  }

  // Load org + members
  const [org, members] = await Promise.all([
    prisma.organisation.findUnique({
      where: { id: currentOrgId },
      select: {
        id: true,
        organisationId: true,
        organisationKey: true,
        name: true,
        ownerOrgUserId: true,
        ownerOrgUsername: true,
        ownerOrgUserEmail: true,
        createdAt: true,
        updatedAt: true,
        address1: true,
        address2: true,
        state: true,
        zipcode: true,
        country: true,
        taxNumber: true,
      },
    }),
    prisma.user.findMany({
      where: { currentOrganisationId: currentOrgId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        defaultOrganisationId: true,
        currentOrganisationId: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!org) {
    return (
      <div className="pl-9 pb-20">
        <h2 className="text-red-600 font-semibold">Organisation not found</h2>
        <SwitchOrgForm />
      </div>
    );
  }

  const isOwner = org.ownerOrgUserId === appUser.id;

  return (
    <div className="pl-9 pb-20">
      {/* Messages */}
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-xl md:text-2xl font-bold">Organisation</h1>
        {params.orgSwitched && (
          <p className="text-green-700 text-sm">
            Switched organisation successfully.
          </p>
        )}
        {params.updated && (
          <p className="text-green-700 text-sm">Organisation updated.</p>
        )}
        {params.memberRemoved && (
          <p className="text-green-700 text-sm">Member removed.</p>
        )}
        {params.error && <p className="text-red-600 text-sm">{params.error}</p>}
      </div>

      {/* Org summary */}
      <div className="rounded border bg-white shadow-sm w-full max-w-4xl">
        <div className="p-4 border-b flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-500" />
          <span className="font-semibold">
            {org.name ?? "Unnamed Organisation"}
          </span>

          {/* Edit button (owner only) */}
          {isOwner && (
            <Link
              href="/org/edit"
              className="ml-auto inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1.5 rounded text-sm"
            >
              <Pencil className="w-4 h-4" /> Edit Organisation
            </Link>
          )}
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
          <div>
            <span className="text-gray-500">Internal ID:</span>
            <div className="mt-1">{org.id}</div>
          </div>
          <div>
            <span className="text-gray-500">External ID (slug):</span>
            <div className="mt-1">{org.organisationId}</div>
          </div>
          <div>
            <span className="text-gray-500">Owner:</span>
            <div className="mt-1 flex items-center gap-2">
              <User2 className="w-4 h-4 text-gray-500" />
              <span>{org.ownerOrgUsername ?? "—"}</span>
              <span className="text-gray-500">
                ({org.ownerOrgUserEmail ?? "—"})
              </span>
            </div>
          </div>
          <div>
            <span className="text-gray-500">Updated:</span>
            <div className="mt-1">
              {new Date(org.updatedAt)
                .toISOString()
                .slice(0, 19)
                .replace("T", " ")}
            </div>
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <span className="text-gray-500">Address:</span>
            <div className="mt-1">
              {[org.address1, org.address2].filter(Boolean).join(", ") || "—"}
            </div>
            <div className="mt-1">
              {[org.state, org.zipcode, org.country]
                .filter(Boolean)
                .join(", ") || "—"}
            </div>
          </div>

          <div>
            <span className="text-gray-500">Tax Number:</span>
            <div className="mt-1">{org.taxNumber ?? "—"}</div>
          </div>
        </div>

        {/* Passkey (owner-only) */}
        <div className="p-4 border-t">
          <span className="text-gray-500">Passkey:</span>
          <div className="mt-2">
            {isOwner ? (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded font-mono text-sm">
                <KeyRound className="w-4 h-4 text-gray-600" />
                <span>{org.organisationKey}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded">
                <EyeOff className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 text-sm">
                  Hidden — only visible to the organisation owner
                </span>
              </div>
            )}
          </div>
          <div className="mt-2">
            {isOwner && (
              <form action={regenerateOrgPasskey} className="inline-block ml-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                  title="Regenerate passkey"
                >
                  <RefreshCcw className="w-3 h-3" /> Regenerate
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="mt-8 rounded border bg-white shadow-sm w-full max-w-4xl">
        <div className="p-4 border-b flex items-center gap-2">
          <User2 className="w-5 h-5 text-gray-500" />
          <span className="font-semibold">Members</span>
          <span className="text-xs text-gray-500 ml-2">
            ({members.length} currently in this org)
          </span>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="table-auto border-collapse border border-gray-300 w-full text-sm font-mono">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left text-gray-600">
                  User ID
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-gray-600">
                  Name
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-gray-600">
                  Email
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-gray-600">
                  Access
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {members.length === 1 ? (
                <tr>
                  <td
                    className="border border-gray-300 px-3 py-2 text-gray-500 italic"
                    colSpan={5}
                  >
                    Invite your colleagues/employees/friends/partners to
                    collaborate. Share your ID and Passkey !!
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  // Access levels:
                  // - Owner: org.ownerOrgUserId === m.id
                  // - Admin: m.defaultOrganisationId === org.id
                  // - Member: otherwise (switched into non-default)
                  const isMemberOwner = org.ownerOrgUserId === m.id;
                  const isAdmin = m.defaultOrganisationId === org.id;

                  return (
                    <tr
                      key={m.id}
                      className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                    >
                      <td className="border border-gray-300 px-3 py-2">
                        {m.id}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {m.name ?? "—"}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {m.email ?? "—"}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {isMemberOwner ? (
                          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                            <ShieldCheck className="w-3 h-3" /> Owner
                          </span>
                        ) : isAdmin ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                            Member
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <div className="flex items-center gap-3">
                          {/* Owner-only remove; never allow removing the owner */}
                          {isOwner && !isMemberOwner && (
                            <form action={removeMember}>
                              <input
                                type="hidden"
                                name="organisationId"
                                value={org.id}
                              />
                              <input type="hidden" name="userId" value={m.id} />
                              <button
                                type="submit"
                                className="inline-flex items-center text-gray-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition relative group"
                              >
                                <UserMinus className="w-4 h-4" />
                                <span className="absolute bottom-full ml-6 mt-2 left-full -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                                  Remove
                                </span>
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Organisation + Reset */}
      <div className="mt-8 w-full max-w-4xl rounded border bg-white shadow-sm">
        <div className="p-4 border-b flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-gray-500" />
          <span className="font-semibold">Change Organisation</span>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Enter the target organisation’s <b>Org ID</b> and <b>Passkey</b> to
            switch. Switching to your default org makes your role{" "}
            <code>ADMIN</code>; switching to any other org makes your role{" "}
            <code>MEMBER</code>.
          </p>

          <SwitchOrgForm />

          {/* One-click reset (only if you're not already in default org) */}
          {defaultOrgId && currentOrgId !== defaultOrgId && (
            <form action={resetToDefaultOrg} className="mt-4">
              <button
                type="submit"
                className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded text-sm font-semibold inline-flex items-center gap-2"
              >
                <PackageOpen className="w-4 h-4" />
                Reset to Default Org (ADMIN)
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/** Reusable Change Org form */
function SwitchOrgForm() {
  return (
    <form action={switchOrg} className="flex flex-col md:flex-row gap-3">
      <input
        type="text"
        name="orgId"
        placeholder="Target Org ID"
        className="border p-2 rounded font-mono text-sm w-full md:w-1/3"
        required
      />
      <input
        type="text"
        name="passkey"
        placeholder="Passkey"
        className="border p-2 rounded font-mono text-sm w-full md:w-1/3"
        required
      />
      <button
        type="submit"
        className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded text-sm font-semibold"
      >
        Change Org
      </button>
    </form>
  );
}
