


// app/customers/customer.ts
'use server'

import { prisma } from '@/lib/prisma'
import { requireVerifiedUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getCustomers() {
  const { appUser } = await requireVerifiedUser()
  const orgId = appUser.currentOrganisationId
  if (!orgId) redirect('/error?message=No current organisation set')

  return prisma.customer.findMany({
    where: { organisationId: orgId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getCustomerById(id: number) {
  const { appUser } = await requireVerifiedUser()
  const customer = await prisma.customer.findUnique({ where: { id } })
  if (!customer || customer.organisationId !== appUser.currentOrganisationId) {
    redirect('/error?message=Customer not found or forbidden')
  }
  return customer
}

export async function addCustomer(formData: FormData) {
  const { appUser } = await requireVerifiedUser()
  const orgId = appUser.currentOrganisationId
  if (!orgId) redirect('/error?message=No current organisation set')

  const name = String(formData.get('name') ?? '').trim()
  const address1 = String(formData.get('address1') ?? '').trim() || null
  const address2 = String(formData.get('address2') ?? '').trim() || null
  const state = String(formData.get('state') ?? '').trim() || null
  const country = String(formData.get('country') ?? '').trim() || null
  const zipcode = String(formData.get('zipcode') ?? '').trim() || null
  const taxNumber = String(formData.get('taxNumber') ?? '').trim() || null
  const contactNumber = String(formData.get('contactNumber') ?? '').trim() || null
  const email = String(formData.get('email') ?? '').trim() || null

  if (!name) redirect('/error?message=Customer name is required')

  // org-scoped unique name
  const dupe = await prisma.customer.findUnique({
    where: { organisationId_name: { organisationId: orgId, name } },
    select: { id: true },
  })
  if (dupe) redirect('/error?message=Customer already exists in this organisation')

  await prisma.customer.create({
    data: {
      organisationId: orgId,
      name,
      address1, address2, state, country, zipcode,
      taxNumber, contactNumber, email,
      createdByEmail: String(appUser.email ?? ''),
      updatedByEmail: String(appUser.email ?? ''),
    },
  })

  revalidatePath('/customers')
  redirect('/customers?added=true')
}

export async function updateCustomer(formData: FormData) {
  const { appUser } = await requireVerifiedUser()
  const orgId = appUser.currentOrganisationId
  if (!orgId) redirect('/error?message=No current organisation set')

  const id = Number(formData.get('id'))
  if (!Number.isFinite(id) || id <= 0) redirect('/error?message=Invalid customer id')

  const name = String(formData.get('name') ?? '').trim()
  const address1 = String(formData.get('address1') ?? '').trim() || null
  const address2 = String(formData.get('address2') ?? '').trim() || null
  const state = String(formData.get('state') ?? '').trim() || null
  const country = String(formData.get('country') ?? '').trim() || null
  const zipcode = String(formData.get('zipcode') ?? '').trim() || null
  const taxNumber = String(formData.get('taxNumber') ?? '').trim() || null
  const contactNumber = String(formData.get('contactNumber') ?? '').trim() || null
  const email = String(formData.get('email') ?? '').trim() || null

  if (!name) redirect('/error?message=Customer name is required')

  const existing = await prisma.customer.findUnique({ where: { id } })
  if (!existing) redirect('/error?message=Customer not found')
  if (existing.organisationId !== orgId) redirect('/error?message=Forbidden: wrong organisation')

  // Optional: check name uniqueness when changed
  if (existing.name !== name) {
    const dupe = await prisma.customer.findUnique({
      where: { organisationId_name: { organisationId: orgId, name } },
      select: { id: true },
    })
    if (dupe) redirect('/error?message=Another customer with this name already exists')
  }

  await prisma.customer.update({
    where: { id },
    data: {
      name,
      address1, address2, state, country, zipcode,
      taxNumber, contactNumber, email,
      updatedByEmail: String(appUser.email ?? ''),
    },
  })

  revalidatePath('/customers')
  redirect('/customers?update=true')
}

export async function deleteCustomer(formData: FormData) {
  const { appUser } = await requireVerifiedUser()
  const orgId = appUser.currentOrganisationId
  if (!orgId) redirect('/error?message=No current organisation set')

  const id = Number(formData.get('id'))
  if (!Number.isFinite(id) || id <= 0) redirect('/error?message=Invalid customer id')

  const existing = await prisma.customer.findUnique({ where: { id }, select: { organisationId: true } })
  if (!existing) redirect('/error?message=Customer not found')
  if (existing.organisationId !== orgId) redirect('/error?message=Forbidden: wrong organisation')

  // Prevent deletion if linked Orders exist
  const linkedOrders = await prisma.order.count({ where: { customerId: id } })
  if (linkedOrders > 0) redirect('/error?message=Cannot delete customer linked to orders')

  // Prevent deletion if linked Contacts exist
  const linkedContacts = await prisma.contact.count({ where: { customerId: id } })
  if (linkedContacts > 0) redirect('/error?message=Cannot delete customer with contacts')

  await prisma.customer.delete({ where: { id } })

revalidatePath('/customers')
  redirect('/customers?delete=true')
  }