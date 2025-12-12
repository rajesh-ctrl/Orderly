
// lib/orgSwitch.ts
'use server';

import { prisma } from '@/lib/prisma'



/**
 * Switch the user's current organisation.
 * - If switching to default org -> role ADMIN
 * - Else -> role MEMBER
 * Validates passkey (organisationKey).
 */
export async function switchUserOrg(userId: string, targetOrgId: string, passkey: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { defaultOrganisationId: true }
    })
    if (!user) throw new Error('User not found')

    const org = await tx.organisation.findUnique({ where: { id: targetOrgId } })
    if (!org) throw new Error('Organisation not found')
    if (org.organisationKey !== passkey) throw new Error('Invalid passkey')

    const role = (user.defaultOrganisationId === org.id) ? 'ADMIN' : 'MEMBER'

    return tx.user.update({
      where: { id: userId },
      data: {
        currentOrganisationId: org.id,
        role
           }
    })
  })
}


/** Switch org by orgId + passkey (you may already have this) */
export async function switchOrg(formData: FormData) {
  const { appUser } = await requireUser()
  const orgId = String(formData.get('orgId') ?? '')
  const passkey = String(formData.get('passkey') ?? '')

  if (!orgId || !passkey) redirect('/error?message=OrgId and passkey required')

  await switchUserOrg(appUser.id, orgId, passkey)

  revalidatePath('/org')
  revalidatePath('/products')
  revalidatePath('/orders')
  redirect('/org?orgSwitched=true')
}




import { requireUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/** One-click: reset current org to user's default org and role to ADMIN */
export async function resetToDefaultOrg() {
  const { appUser } = await requireUser();

  if (!appUser.defaultOrganisationId) {
    redirect('/error?message=No default organisation found');
  }

  // If already in default org, we still set ADMIN to be safe
  await prisma.user.update({
    where: { id: appUser.id },
    data: {
      currentOrganisationId: appUser.defaultOrganisationId,
      role: 'ADMIN',
    },
  });

  // Revalidate pages depending on current org context
  revalidatePath('/org');
  revalidatePath('/products');
  revalidatePath('/orders');

  // Optional: include a flag in query string
  redirect('/org?orgSwitched=true');
}
