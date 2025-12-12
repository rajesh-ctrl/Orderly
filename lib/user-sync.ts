
// lib/user-sync.ts
import { prisma } from '@/lib/prisma'
import { makeOrgKey, makePersonalOrgId } from '../app/org/org-ids'

export type StackUserLite = {
  id: string
  primaryEmail?: string | null
  name?: string | null
  displayName?: string | null
  display_name?: string | null
}

/**
 * Create user + personal default org on first login; on later logins:
 * - update user profile
 * - propagate owner snapshot (email/name) to any organisations the user owns
 */
export async function syncUserOnLogin(su: StackUserLite) {
  const now = new Date()
  const display = su.displayName ?? su.display_name ?? su.name ?? null
  const email = su.primaryEmail ?? null

  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { id: su.id } })

    if (!existing) {
      // 1) First time: create user
      const user = await tx.user.create({
        data: {
          id: su.id,
          email,             // save email
          name: display,
          lastSeenAt: now,
          role: 'ADMIN',     // provisional; current==default below
        },
      })

      // 2) Create immutable personal default org
      const orgId  = makePersonalOrgId(user.id)
      const orgKey = makeOrgKey()

      await tx.organisation.create({
        data: {
          id: orgId,
          organisationId: orgId,
          organisationKey: orgKey,
          ownerOrgUserId: user.id,
          ownerOrgUserEmail: user.email ?? null, // owner snapshot
          ownerOrgUsername: user.name ?? null,   // owner snapshot
          name: `${user.name ?? 'Personal'} Org`,
        },
      })

      // 3) Point default & current to personal org, set role ADMIN
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          defaultOrganisationId: orgId,
          currentOrganisationId: orgId,
                   role: 'ADMIN',
        },
      })

      return updated
    }

    // -------- Subsequent logins --------
    // 1) Update user profile (email/name/lastSeenAt)
    const updatedUser = await tx.user.update({
      where: { id: su.id },
      data: {
        email,       // keep email fresh
        name: display,
        lastSeenAt: now,
      },
    })

    // 2) Propagate owner snapshot to any orgs they own
    //    (personal default org + any other orgs where ownerOrgUserId = user.id)
    await tx.organisation.updateMany({
      where: { ownerOrgUserId: updatedUser.id },
      data: {
        ownerOrgUserEmail: updatedUser.email ?? null,
        ownerOrgUsername: updatedUser.name ?? null,
      },
    })

    return updatedUser
  })
}