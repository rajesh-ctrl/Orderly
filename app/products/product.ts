
// app/products/product.ts
'use server'

import { prisma } from '@/lib/prisma'
// import { Prisma } from '@prisma/client' // <-- use @prisma/client
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
// import { PrismaClient } from '@prisma/client/extension'
import { Prisma } from '@/generated/prisma/client'

// ========= READS =========
export async function getProducts() {
  const { appUser } = await requireUser()
  const orgId = appUser.currentOrganisationId
  if (!orgId) {
    redirect('/error?message=No current organisation set')
  }

  return prisma.product.findMany({
    where: { organisationId: orgId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProductById(id: number) {
  const { appUser } = await requireUser()
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product || product.organisationId !== appUser.currentOrganisationId) {
    redirect('/error?message=Product not found or forbidden')
  }
  return product
}

// ========= CREATE =========
export async function addProduct(formData: FormData) {
  const { appUser } = await requireUser()
  const orgId = appUser.currentOrganisationId
  if (!orgId) redirect('/error?message=No current organisation set')

  const name = String(formData.get('name') ?? '').trim()
  const sku = String(formData.get('sku') ?? '').trim()
  const HSN = String(formData.get('hsn') ?? '').trim()

  const currency = String(formData.get('currency') ?? 'INR').trim()
  const taxRatePctNum = Number(formData.get('taxRatePct'))
  const transferNum = Number(formData.get('transferprice'))
  const priceNum = Number(formData.get('price'))
  const stockNum = Number(formData.get('stock'))

  if (!name) redirect('/error?message=Name is required')
  if (!sku) redirect('/error?message=SKU is required')
  if (!HSN) redirect('/error?message=HSN is required')

  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    redirect('/error?message=Price must be greater than zero')
  }
  if (!Number.isFinite(transferNum) || transferNum < 0) {
    redirect('/error?message=Transfer price must be 0 or greater')
  }
  if (!Number.isFinite(taxRatePctNum) || taxRatePctNum < 0) {
    redirect('/error?message=Tax rate must be 0 or greater')
  }
  if (!Number.isInteger(stockNum) || stockNum < 0) {
    redirect('/error?message=Stock must be 0 or greater')
  }

  // Uniqueness within organisation (compound unique keys)
  const existingBySku = await prisma.product.findUnique({
    where: { organisationId_sku: { organisationId: orgId, sku } },
  })
  if (existingBySku) {
    redirect('/error?message=Already a product is available with the same SKU, update that record if needed')
  }

  const existingByHsn = await prisma.product.findUnique({
    where: { organisationId_HSN: { organisationId: orgId, HSN } },
  })
  if (existingByHsn) {
    redirect('/error?message=Already a product is available with the same HSN, update that record if needed')
  }

  await prisma.product.create({
    data: {
      organisationId: orgId,
      userId: appUser.id,
      name,
      sku,
      HSN,
      currency,
      taxRatePct: new Prisma.Decimal(taxRatePctNum),
      transferprice: new Prisma.Decimal(transferNum),
      price: new Prisma.Decimal(priceNum),
      stock: stockNum,

      // audit
      createdByEmail: String(appUser.email ?? ''),
      updatedByEmail: String(appUser.email ?? ''),
    },
  })

  revalidatePath('/products')
  redirect('/products?added=true')
}

// ========= UPDATE =========
export async function updateProduct(formData: FormData) {
  const { appUser } = await requireUser()
  const orgId = appUser.currentOrganisationId
  if (!orgId) redirect('/error?message=No current organisation set')

  const id = Number(formData.get('id'))
  const name = String(formData.get('name') ?? '').trim()
  const currency = String(formData.get('currency') ?? 'INR').trim()
  const taxRatePctNum = Number(formData.get('taxRatePct'))
  const transferNum = Number(formData.get('transferprice'))
  const priceNum = Number(formData.get('price'))
  const stockNum = Number(formData.get('stock'))

  if (!id || Number.isNaN(id)) redirect('/error?message=Invalid product id')
  if (!name) redirect('/error?message=Name is required')

  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    redirect('/error?message=Price must be greater than zero')
  }
  if (!Number.isFinite(transferNum) || transferNum < 0) {
    redirect('/error?message=Transfer price must be 0 or greater')
  }
  if (!Number.isFinite(taxRatePctNum) || taxRatePctNum < 0) {
    redirect('/error?message=Tax rate must be 0 or greater')
  }
  if (!Number.isInteger(stockNum) || stockNum < 0) {
    redirect('/error?message=Stock must be 0 or greater')
  }

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) redirect('/error?message=Product not found')
  if (existing.organisationId !== orgId) {
    redirect('/error?message=Forbidden: Switch to product’s organisation to modify it')
  }

  await prisma.product.update({
    where: { id },
    data: {
      name,
      currency,
      taxRatePct: new Prisma.Decimal(taxRatePctNum),
      transferprice: new Prisma.Decimal(transferNum),
      price: new Prisma.Decimal(priceNum),
      stock: stockNum,

      // audit
      updatedByEmail: String(appUser.email ?? ''),
      // IMPORTANT: do not allow organisationId updates here
    },
  })

  revalidatePath('/products')
  redirect('/products?update=true')
}

// ========= DELETE =========
export async function deleteProduct(formData: FormData) {
  const { appUser } = await requireUser()
  const id = Number(formData.get('id'))
  if (!id || Number.isNaN(id)) {
    redirect('/error?message=Invalid Product ID')
  }

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) redirect('/error?message=Product not found')
  if (existing.organisationId !== appUser.currentOrganisationId) {
    redirect('/error?message=Forbidden: Switch to product’s organisation to delete it')
  }

  // Prevent deletion if linked to orders
  const linkedOrders = await prisma.orderItem.count({ where: { productId: id } })
  if (linkedOrders > 0) {
    redirect('/error?message=Cannot delete product linked to existing orders')
  }

  await prisma.product.delete({ where: { id } })

  revalidatePath('/products')
  redirect('/products?delete=true')
}