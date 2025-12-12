
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
// import { switchUserOrg } from '@/lib/orgSwitch'  // you already created this earlier



/** Owner-only: update editable profile fields of the current org */
export async function updateOrganisationProfile(formData: FormData) {
  const { appUser } = await requireUser()
  const orgId = String(formData.get('orgId') ?? '')
  if (!orgId) redirect('/error?message=Invalid organisation')

  // Fetch org & owner check
  const org = await prisma.organisation.findUnique({
    where: { id: orgId },
    select: { ownerOrgUserId: true },
  })
  if (!org) redirect('/error?message=Organisation not found')
  if (org.ownerOrgUserId !== appUser.id)
    redirect('/error?message=Only owner can edit organisation')

  // Gather editable fields
  const name = formData.get('name')?.toString() || null
  const address1 = formData.get('address1')?.toString() || null
  const address2 = formData.get('address2')?.toString() || null
  const state = formData.get('state')?.toString() || null
  const zipcode = formData.get('zipcode')?.toString() || null
  const country = formData.get('country')?.toString() || null
  const taxNumber = formData.get('taxNumber')?.toString() || null

  // Never allow changing organisationId / organisationKey here
  await prisma.organisation.update({
    where: { id: orgId },
    data: { name, address1, address2, state, zipcode, country, taxNumber },
  })

  revalidatePath('/org')
  redirect('/org?updated=true')
}

/** Owner-only: remove a member from this org (reset to their default org) */
export async function removeMember(formData: FormData) {
  const { appUser } = await requireUser()
  const organisationId = String(formData.get('organisationId') ?? '')
  const targetUserId = String(formData.get('userId') ?? '')

  if (!organisationId || !targetUserId) {
    redirect('/error?message=Invalid remove request')
  }
  if (targetUserId === appUser.id) {
    redirect('/error?message=Owner cannot remove self')
  }

  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    select: { ownerOrgUserId: true },
  })
  if (!org) redirect('/error?message=Organisation not found')
  if (org.ownerOrgUserId !== appUser.id)
    redirect('/error?message=Only owner can remove members')

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { defaultOrganisationId: true },
  })
  if (!target) redirect('/error?message=User not found')

  // Reset target user to their default org  // Reset target user to their default org and ADMIN role there
  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      currentOrganisationId: target.defaultOrganisationId,
      role: 'ADMIN',
    },
  })

  revalidatePath('/org')
  revalidatePath('/products')
  redirect('/org?memberRemoved=true')
}