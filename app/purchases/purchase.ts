// app/purchases/purchase.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireVerifiedUser } from '@/lib/auth'
import { Prisma } from '@/generated/prisma/client'

const round2 = (n: number) => Math.round(n * 100) / 100

function generatePoNumber(now = new Date()) {
  const yy = now.getFullYear().toString().slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(10000 + Math.random() * 90000)
  return `PO-${yy}${mm}${dd}-${rand}`
}
async function getUniquePoNumber(orgId: string) {
  for (let tries = 0; tries < 5; tries++) {
    const candidate = generatePoNumber()
    const dupe = await prisma.purchase.findUnique({
      where: { organisationId_poNumber: { organisationId: orgId, poNumber: candidate } },
      select: { id: true },
    })
    if (!dupe) return candidate
  }
  return `${generatePoNumber()}-${Math.floor(Math.random() * 1000)}`
}

export async function addPurchase(formData: FormData) {
  const { appUser } = await requireVerifiedUser()
  if (!appUser.currentOrganisationId) redirect('/error?message=No current organisation set')
  const orgId = appUser.currentOrganisationId!

  // Header
  const supplierId = Number(formData.get('supplierId'))
  const contactIdRaw = formData.get('contactId')
  const contactId = contactIdRaw ? Number(contactIdRaw) : null
  const status = (formData.get('status')?.toString() || 'Pending').trim()
  const currency = (formData.get('currency')?.toString() || 'INR').trim()

  const taxInclusiveStr = String(formData.get('taxInclusive') ?? 'true').toLowerCase()
  const taxInclusive = taxInclusiveStr === 'true' || taxInclusiveStr === '1' || taxInclusiveStr === 'yes'

  if (!Number.isFinite(supplierId) || supplierId <= 0) redirect('/error?message=Invalid supplier')
  if (!currency) redirect('/error?message=Currency is required')

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { organisationId: true },
  })
  if (!supplier || supplier.organisationId !== orgId) {
    redirect('/error?message=supplier not found in current organisation')
  }

  if (contactId) {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { organisationId: true, supplierId: true },
    })
    if (!contact || contact.organisationId !== orgId || contact.supplierId !== supplierId) {
      redirect('/error?message=Selected contact does not belong to this supplier/org')
    }
  }

  // Lines
  const productIds = formData.getAll('productId')
  const quantities = formData.getAll('quantity')
  const unitPrices = formData.getAll('unitPrice')   // user-entered EXCL tax => actualprice
  const taxRatePcts = formData.getAll('taxRatePct') // per-line override

  if (productIds.length === 0) redirect('/error?message=No products selected')

  const equalLengths =
    productIds.length === quantities.length &&
    productIds.length === unitPrices.length &&
    productIds.length === taxRatePcts.length
  if (!equalLengths) redirect('/error?message=Line arrays length mismatch')

  const productIdNums = productIds.map((id) => Number(id))
  if (productIdNums.some((n) => !Number.isFinite(n) || n <= 0)) {
    redirect('/error?message=Invalid product id in submission')
  }

  // Products
  const products = await prisma.product.findMany({
    where: { id: { in: productIdNums } },
    select: {
      id: true, name: true, sku: true, HSN: true, price: true, taxRatePct: true,
      currency: true, organisationId: true, stock: true,
    },
  })
  // if (products.length !== productIdNums.length) redirect('/error?message=Some products not found')
  if (products.some((p) => p.organisationId !== orgId)) {
    redirect('/error?message=All products must be from current organisation')
  }

  // Build items: actualprice = user-entered EXCL tax; unitPrice = catalog snapshot
  const itemsData = productIds.map((id, i) => {
    const qty = Number(quantities[i])
    const actualPerUnit = Number(unitPrices[i])    // EXCL tax
    const overridePct = Number(taxRatePcts[i])     // per-line %

    if (!Number.isFinite(qty) || qty <= 0) redirect('/error?message=Quantity must be greater than zero')
    if (!Number.isFinite(actualPerUnit) || actualPerUnit <= 0) redirect('/error?message=Unit price must be greater than zero')
    if (!Number.isFinite(overridePct) || overridePct < 0) redirect('/error?message=Tax% must be valid and non-negative')

    const product = products.find((p) => p.id === Number(id))
    if (!product) redirect('/error?message=Invalid product row')

    const catalogUnitSnapshot = Number(product.price)
    const rate = overridePct / 100

    const lineBase = round2(actualPerUnit * qty)     // EXCL tax
    const lineTax = taxInclusive ? round2(lineBase * rate) : 0
    const lineTotal = round2(lineBase + lineTax)

    return {
      organisationId: orgId,
      productId: product.id,
      productname: product.name,
      sku: product.sku,
      HSN: product.HSN,

      quantity: qty,
      unitPrice: new Prisma.Decimal(catalogUnitSnapshot), // snapshot catalog
      actualprice: new Prisma.Decimal(actualPerUnit),     // charged per-unit (EXCL tax)
      taxRatePct: new Prisma.Decimal(overridePct),

      lineTaxAmount: new Prisma.Decimal(lineTax),
      lineTotal: new Prisma.Decimal(lineTotal),
      currency,

      createdByEmail: String(appUser.email ?? ''),
      updatedByEmail: String(appUser.email ?? ''),
    }
  })

  const subtotal = round2(itemsData.reduce((s, i) => s + (Number(i.lineTotal) - Number(i.lineTaxAmount)), 0))
  const totalTaxAmount = taxInclusive
    ? round2(itemsData.reduce((s, i) => s + Number(i.lineTaxAmount), 0))
    : 0

  // ---- Tax components: must sum to exactly 100% when inclusive ----
  const taxComponentNames = formData.getAll('taxComponentName').map((x) => String(x ?? '').trim())
  const taxComponentPcts = formData.getAll('taxComponentPct').map((x) => Number(x))
  if (taxComponentNames.length !== taxComponentPcts.length) {
    redirect('/error?message=Tax components arrays length mismatch')
  }

  let taxComponents = taxComponentNames
    .map((name, idx) => ({ name, percentage: Number(taxComponentPcts[idx]) }))
    .filter((t) => t.name)

  // Cap to 2 components
  if (taxComponents.length > 2) taxComponents = taxComponents.slice(0, 2)

  for (let i = 0; i < taxComponents.length; i++) {
    const t = taxComponents[i]
    if (!Number.isFinite(t.percentage) || t.percentage < 0) {
      redirect(`/error?message=Tax component #${i + 1} percentage must be >= 0`)
    }
  }

  if (taxInclusive) {
    if (taxComponents.length === 0) {
      redirect('/error?message=Add at least one tax component in inclusive mode')
    }
    const sum = taxComponents.reduce((s, t) => s + t.percentage, 0)
    // allow a tiny float tolerance
    if (Math.abs(sum - 100) > 0.000001) {
      redirect('/error?message=Tax components must sum to exactly 100%')
    }
  } else {
    // ignore components in exclusive mode
    taxComponents = []
  }

  const taxBreakdownJson = taxComponents
  const taxBreakdownText =
    taxComponents.length > 0 ? taxComponents.map((t) => `${t.name} ${t.percentage}%`).join(' + ') : null

  // ---- Additional Charges (only one) ----
  const addChargeNameRaw = (formData.get('additionalChargeName') ?? '').toString().trim()
  const addChargeAmtRaw = (formData.get('additionalChargeAmount') ?? '').toString().trim()
  const additionalCharges =
    addChargeNameRaw || addChargeAmtRaw
      ? {
          name: addChargeNameRaw || 'Other charges',
          amount: Number(addChargeAmtRaw || 0),
        }
      : null
  if (additionalCharges) {
    if (!Number.isFinite(additionalCharges.amount) || additionalCharges.amount < 0) {
      redirect('/error?message=Other charges amount must be a non-negative number')
    }
  }

  const additionalAmount = additionalCharges?.amount ?? 0
  const total = round2(subtotal + totalTaxAmount + additionalAmount)

  const poNumber = await getUniquePoNumber(orgId)

  await prisma.$transaction(async (tx) => {
    await tx.purchase.create({
      data: {
        organisationId: orgId,
        supplierId,
        contactId: contactId ?? null,
        currency,
        status,
        poNumber,

        taxInclusive,
        taxBreakdownJson: taxBreakdownJson as unknown as Prisma.InputJsonValue,
        taxBreakdownText,
        additionalCharges: additionalCharges as unknown as Prisma.InputJsonValue,

        subtotal: new Prisma.Decimal(subtotal),
        totalTaxAmount: new Prisma.Decimal(totalTaxAmount),
        total: new Prisma.Decimal(total),

        createdByEmail: String(appUser.email ?? ''),
        updatedByEmail: String(appUser.email ?? ''),
        items: { create: itemsData },
      },
    })

    // Decrement stock
    for (const item of itemsData) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }
  })

  revalidatePath('/purchases')
  redirect(`/purchases?added=true&po=${encodeURIComponent(poNumber)}`)
}

/* keep your existing updatepurchaseStatus and deletepurchase functions unchanged */


/* ============================================================================
 * UPDATE purchase STATUS
 * Stock adjustments:
 *   - Pending/Paid -> Cancelled : restore stock
 *   - Cancelled -> Pending/Paid : re-decrement stock
 * ========================================================================== */
export async function updatePurchaseStatus(formData: FormData) {
  const { appUser } = await requireVerifiedUser()
  if (!appUser.currentOrganisationId) redirect('/error?message=No current organisation set')
  const orgId = appUser.currentOrganisationId!

  const purchaseId = Number(formData.get('purchaseId'))
  const newStatusRaw = String(formData.get('status') ?? '').trim()
  const newStatus = newStatusRaw || 'Pending'

  if (!Number.isFinite(purchaseId) || purchaseId <= 0) {
    redirect('/error?message=Invalid form submission')
  }

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { items: true },
  })
  if (!purchase) redirect('/error?message=purchase not found')
  if (purchase.organisationId !== orgId) redirect('/error?message=Forbidden: wrong organisation')

  const oldStatus = purchase.status

  await prisma.$transaction(async (tx) => {
    if ((oldStatus === 'Pending' || oldStatus === 'Paid') && newStatus === 'Cancelled') {
      // Restore stock
      for (const item of purchase.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
    } else if (oldStatus === 'Cancelled' && (newStatus === 'Pending' || newStatus === 'Paid')) {
      // Re-decrement stock
      for (const item of purchase.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }
    }

    await tx.purchase.update({
      where: { id: purchaseId },
      data: { status: newStatus, updatedByEmail: String(appUser.email ?? '') },
    })
  })

  revalidatePath('/purchases')
  redirect('/purchases?update=true')
}

/* ============================================================================
 * DELETE purchase (ADMIN-ONLY)
 * - Only ADMIN can delete purchases.
 * - Restores stock if the purchase wasn't already Cancelled (to keep inventory correct).
 * ========================================================================== */
export async function deletePurchase(formData: FormData) {
  const { appUser } = await requireVerifiedUser()

  // ✅ Admin-only guard
  const isAdmin = String((appUser as any).role ?? '').toUpperCase() === 'ADMIN'
  if (!isAdmin) {
    redirect('/error?message=Only admins can delete purchases')
  }

  if (!appUser.currentOrganisationId) {
    redirect('/error?message=No current organisation set')
  }
  const orgId = appUser.currentOrganisationId!

  const id = Number(formData.get('id'))
  if (!id || Number.isNaN(id)) redirect('/error?message=Invalid purchase ID')

  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!purchase) redirect('/error?message=purchase not found')
  if (purchase.organisationId !== orgId) redirect('/error?message=Forbidden: wrong organisation')

  await prisma.$transaction(async (tx) => {
    // If not already cancelled, restore stock before delete
    if (purchase.status !== 'Cancelled') {
      for (const item of purchase.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
    }

    await tx.purchase.delete({ where: { id } })
  })

  revalidatePath('/purchases')
  redirect('/purchases?delete=true')
}
