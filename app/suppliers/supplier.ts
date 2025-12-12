
// app/suppliers/supplier.ts
'use server'

import { prisma } from '@/lib/prisma'
import { requireVerifiedUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Read all (not used directly by page; page queries inline for filters/pagination)
export async function getSuppliers() {
  const { appUser } = await requireVerifiedUser()
  const orgId = appUser.currentOrganisationId
  if (!orgId) redirect('/error?message=No current organisation set')

  return prisma.supplier.findMany({
    where: { organisationId: orgId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getSupplierById(id: number) {
  const { appUser } = await requireVerifiedUser()
  const supplier = await prisma.supplier.findUnique({ where: { id } })
  if (!supplier || supplier.organisationId !== appUser.currentOrganisationId) {
    redirect('/error?message=Supplier not found or forbidden')
  }
  return supplier
}

export async function addSupplier(formData: FormData) {
  const { appUser } = await requireVerifiedUser()
  if (!appUser.currentOrganisationId) {
    redirect('/error?message=No current organisation set')
  }
  const orgId = appUser.currentOrganisationId!

  const name = String(formData.get('name') ?? '').trim()
  const taxNumber = String(formData.get('taxNumber') ?? '').trim() || null
  const contactNumber = String(formData.get('contactNumber') ?? '').trim() || null
  const email = String(formData.get('email') ?? '').trim() || null
  const address1 = String(formData.get('address1') ?? '').trim() || null
  const address2 = String(formData.get('address2') ?? '').trim() || null
  const state = String(formData.get('state') ?? '').trim() || null
  const country = String(formData.get('country') ?? '').trim() || null
  const zipcode = String(formData.get('zipcode') ?? '').trim() || null

  if (!name) redirect('/error?message=Supplier name is required')

  // org-scoped unique by name
  const dupe = await prisma.supplier.findUnique({
    where: { organisationId_name: { organisationId: orgId, name } },
    select: { id: true },
  })
  if (dupe) redirect('/error?message=Supplier already exists in this organisation')

  await prisma.supplier.create({
    data: {
      organisationId: orgId,
      name,
      taxNumber,
      contactNumber,
      email,
      address1,
      address2,
      state,
      country,
      zipcode,
      createdByEmail: String(appUser.email ?? ''),
      updatedByEmail: String(appUser.email ?? ''),
    },
  })

  revalidatePath('/suppliers')
  redirect('/suppliers?added=true')
}

export async function updateSupplier(formData: FormData) {
  const { appUser } = await requireVerifiedUser()
  if (!appUser.currentOrganisationId) {
    redirect('/error?message=No current organisation set')
  }
  const orgId = appUser.currentOrganisationId!

  const id = Number(formData.get('id'))
  if (!Number.isFinite(id) || id <= 0) redirect('/error?message=Invalid supplier id')

  const name = String(formData.get('name') ?? '').trim()
  const taxNumber = String(formData.get('taxNumber') ?? '').trim() || null
  const contactNumber = String(formData.get('contactNumber') ?? '').trim() || null
  const email = String(formData.get('email') ?? '').trim() || null
  const address1 = String(formData.get('address1') ?? '').trim() || null
  const address2 = String(formData.get('address2') ?? '').trim() || null
  const state = String(formData.get('state') ?? '').trim() || null
  const country = String(formData.get('country') ?? '').trim() || null
  const zipcode = String(formData.get('zipcode') ?? '').trim() || null

  if (!name) redirect('/error?message=Supplier name is required')

  const existing = await prisma.supplier.findUnique({ where: { id } })
  if (!existing) redirect('/error?message=Supplier not found')
  if (existing.organisationId !== orgId) redirect('/error?message=Forbidden: wrong organisation')

  if (existing.name !== name) {
    const dupe = await prisma.supplier.findUnique({
      where: { organisationId_name: { organisationId: orgId, name } },
      select: { id: true },
    })
    if (dupe) redirect('/error?message=Another supplier with this name already exists')
  }

  await prisma.supplier.update({
    where: { id },
    data: {
      name,
      taxNumber,
      contactNumber,
      email,
      address1,
      address2,
      state,
      country,
      zipcode,
      updatedByEmail: String(appUser.email ?? ''),
    },
  })

  revalidatePath('/suppliers')
  redirect('/suppliers?update=true')
}

export async function deleteSupplier(formData: FormData) {
  const { appUser } = await requireVerifiedUser()
  if (!appUser.currentOrganisationId) {
    redirect('/error?message=No current organisation set')
  }
  const orgId = appUser.currentOrganisationId!

  const id = Number(formData.get('id'))
  if (!Number.isFinite(id) || id <= 0) redirect('/error?message=Invalid supplier id')

  const existing = await prisma.supplier.findUnique({
    where: { id },
    select: { organisationId: true },
  })
  if (!existing) redirect('/error?message=Supplier not found')
  if (existing.organisationId !== orgId) redirect('/error?message=Forbidden: wrong organisation')

  const linkedPurchases = await prisma.purchase.count({ where: { supplierId: id } })
  if (linkedPurchases > 0) redirect('/error?message=Cannot delete supplier linked to purchases')

  const linkedContacts = await prisma.contact.count({ where: { supplierId: id } })
  if (linkedContacts > 0) redirect('/error?message=Cannot delete supplier with contacts')

  await prisma.supplier.delete({ where: { id } })

  revalidatePath('/suppliers')
  redirect('/suppliers?delete=true')
}