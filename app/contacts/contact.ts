
// app/contacts/contact.ts
'use server'

import { prisma } from '@/lib/prisma'
import { requireVerifiedUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// List all contacts for current org
export async function getContacts() {
  const { appUser } = await requireVerifiedUser()
  const orgId = appUser.currentOrganisationId
  if (!orgId) redirect('/error?message=No current organisation set')

  return prisma.contact.findMany({
    where: { organisationId: orgId },
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
    },
  })
}

// Get a single contact by id (org check)
export async function getContactById(id: number) {
  const { appUser } = await requireVerifiedUser()
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, organisationId: true, name: true } },
      supplier: { select: { id: true, organisationId: true, name: true } },
    },
  })
  if (!contact || contact.organisationId !== appUser.currentOrganisationId) {
    redirect('/error?message=Contact not found or forbidden')
  }
  return contact
}

// Create contact (link to exactly one: customer OR supplier)
export async function addContact(formData: FormData) {
  const { appUser } = await requireVerifiedUser()
  const orgId = appUser.currentOrganisationId
  if (!orgId) redirect('/error?message=No current organisation set')

  const name = String(formData.get('name') ?? '').trim()
  const contactNumber = String(formData.get('contactNumber') ?? '').trim() || null
  const email = String(formData.get('email') ?? '').trim() || null
  const linkType = String(formData.get('linkType') ?? '').trim() // "customer" | "supplier"
  const linkId = Number(formData.get('linkId'))

  if (!name) redirect('/error?message=Contact name is required')
  if (!['customer', 'supplier'].includes(linkType)) redirect('/error?message=Invalid link type')
  if (!Number.isFinite(linkId) || linkId <= 0) redirect('/error?message=Invalid link id')

  if (linkType === 'customer') {
    const customer = await prisma.customer.findUnique({
      where: { id: linkId },
      select: { organisationId: true },
    })
    if (!customer || customer.organisationId !== orgId) {
      redirect('/error?message=Customer not found in current organisation')
    }
  } else {
    const supplier = await prisma.supplier.findUnique({
      where: { id: linkId },
      select: { organisationId: true },
    })
    if (!supplier || supplier.organisationId !== orgId) {
      redirect('/error?message=Supplier not found in current organisation')
    }
  }

  await prisma.contact.create({
    data: {
      organisationId: orgId,
      name,
      contactNumber,
      email,
      customerId: linkType === 'customer' ? linkId : null,
      supplierId: linkType === 'supplier' ? linkId : null,
      createdByEmail: String(appUser.email ?? ''),
      updatedByEmail: String(appUser.email ?? ''),
    },
  })

  revalidatePath('/contacts')
  redirect('/contacts?added=true')
}

// Update contact (link to exactly one side)
export async function updateContact(formData: FormData) {
  const { appUser } = await requireVerifiedUser()
  const orgId = appUser.currentOrganisationId
  if (!orgId) redirect('/error?message=No current organisation set')

  const id = Number(formData.get('id'))
  if (!Number.isFinite(id) || id <= 0) redirect('/error?message=Invalid contact id')

  const name = String(formData.get('name') ?? '').trim()
  const contactNumber = String(formData.get('contactNumber') ?? '').trim() || null
  const email = String(formData.get('email') ?? '').trim() || null
  const linkType = String(formData.get('linkType') ?? '').trim() // "customer" | "supplier"
  const linkId = Number(formData.get('linkId'))

  if (!name) redirect('/error?message=Contact name is required')
  if (!['customer', 'supplier'].includes(linkType)) redirect('/error?message=Invalid link type')
  if (!Number.isFinite(linkId) || linkId <= 0) redirect('/error?message=Invalid link id')

  const existing = await prisma.contact.findUnique({ where: { id } })
  if (!existing) redirect('/error?message=Contact not found')
  if (existing.organisationId !== orgId) redirect('/error?message=Forbidden: wrong organisation')

  if (linkType === 'customer') {
    const customer = await prisma.customer.findUnique({
      where: { id: linkId },
      select: { organisationId: true },
    })
    if (!customer || customer.organisationId !== orgId) {
      redirect('/error?message=Customer not found in current organisation')
    }
  } else {
    const supplier = await prisma.supplier.findUnique({
      where: { id: linkId },
      select: { organisationId: true },
    })
    if (!supplier || supplier.organisationId !== orgId) {
      redirect('/error?message=Supplier not found in current organisation')
    }
  }

  await prisma.contact.update({
    where: { id },
    data: {
      name,
      contactNumber,
      email,
      customerId: linkType === 'customer' ? linkId : null,
      supplierId: linkType === 'supplier' ? linkId : null,
      updatedByEmail: String(appUser.email ?? ''),
    },
  })

  revalidatePath('/contacts')
  redirect('/contacts?update=true')
}

// Delete contact (fixed syntax)
export async function deleteContact(formData: FormData) {
  const { appUser } = await requireVerifiedUser()
  const orgId = appUser.currentOrganisationId
  if (!orgId) redirect('/error?message=No current organisation set')

  const id = Number(formData.get('id'))
  if (!Number.isFinite(id) || id <= 0) redirect('/error?message=Invalid contact id')

  const existing = await prisma.contact.findUnique({
    where: { id },
    select: { organisationId: true },
  })
  if (!existing) redirect('/error?message=Contact not found')
  if (existing.organisationId !== orgId) redirect('/error?message=Forbidden: wrong organisation')

  // Prevent deletion if linked Orders/Purchases exist via contact
  const linkedOrders = await prisma.order.count({ where: { contactId: id } })
  if (linkedOrders > 0) redirect('/error?message=Cannot delete contact linked to orders')

  const linkedPurchases = await prisma.purchase.count({ where: { contactId: id } })
  if (linkedPurchases > 0) redirect('/error?message=Cannot delete contact linked to purchases')

  await prisma.contact.delete({ where: { id } })

  revalidatePath('/contacts')
  redirect('/contacts?delete=true')
}