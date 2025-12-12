// "use server";

// import { prisma } from "@/lib/prisma";
// import { Prisma } from "@/generated/prisma/client";
// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";




// // Fetch all products
// export async function getProducts() {
//   return await prisma.product.findMany({
//     orderBy: { createdAt: "desc" },
//   });
// }


// // Add new product using FormData
// export async function addProduct(formData: FormData) {
//   const name = String(formData.get("name"));
//   const price = Number(formData.get("price"));
//   const stock = Number(formData.get("stock"));

//   if (price <= 0) {
//     redirect("/error?message = Price must be greater than zero");
//   }
//   if (stock <= 0) {
//     redirect("/error?message = Stock must be greater than zero");
//   }

//   await prisma.product.create({
//     data: { name, price, stock },
//   });
// revalidatePath("/products");
//   redirect("/products?added=true");

// }

// export async function getProductById(id: number) {
//   return await prisma.product.findUnique({
//     where: { id },
//   });
// }

// // Update product using FormData
// export async function updateProduct(formData: FormData) {
//   const id = parseInt(formData.get("id") as string);
//   const name = formData.get("name") as string;
//   const price = parseFloat(formData.get("price") as string);
//   const stock = parseInt(formData.get("stock") as string);

  
//     if (price <= 0) {
//           redirect("/error?message=IStock must be greater than zero");

//   }
//   if (stock <= 0) {
//     // redirect("/products/add?error=Stock must be greater than zero");
//               redirect("/error?message=Stock must be greater than zero");

//   }

//   await prisma.product.update({
//     where: { id },
//     data: { name, price, stock },
//   });

//   revalidatePath("/products");
//     redirect("/products?update=true");
// }

// // Delete product

// export async function deleteProduct(formData: FormData) {
//   const id = Number(formData.get("id"));

//   // ✅ Validate ID
//   if (!id || isNaN(id)) {
//     redirect("/error?message=Invalid Product ID");
//   }

//   // ✅ Check if product is linked to any order items
//   const linkedOrders = await prisma.orderItem.count({
//     where: { productId: id },
//   });

//   if (linkedOrders > 0) {
//     redirect("/error?message=Cannot delete product as it is linked to existing orders");
//   }

//   // ✅ Delete product
//   await prisma.product.delete({
//     where: { id },
//   });

//   // ✅ Revalidate products page
//   revalidatePath("/products");

//   // ✅ Redirect to success page
//   redirect("/products?delete=true");
// }


// //Delete Order
// export async function deleteOrder(formData: FormData) {
//   const id = Number(formData.get("id"));

//   if (!id || isNaN(id)) {
//     redirect("/error?message=Invalid order ID");
//   }

//   // ✅ Delete order
//   await prisma.order.delete({ where: { id } });

//   // ✅ Revalidate orders page
//   revalidatePath("/orders");

//   // ✅ Redirect to success page
//   redirect("/orders?delete=true");
// }


// //add order
// export async function addOrder(formData: FormData) {
//   const customerName = formData.get("customerName")?.toString() || "";
//   const status = formData.get("status")?.toString() || "Pending";

//   const productIds = formData.getAll("productId");
//   const quantities = formData.getAll("quantity");
//   const sellingPrices = formData.getAll("sellingPrice");

//   if (productIds.length === 0) {
//     redirect("/error?message=No products selected for the order.");
//   }

//   const products = await prisma.product.findMany({
//     where: {
//       id: { in: productIds.map((id) => Number(id)) },
//     },
//     select: { id: true, price: true },
//   });

//   const orderItems = productIds.map((id, i) => {
//     const quantity = Number(quantities[i]);
//     const sellingPrice = Number(sellingPrices[i]) / Number(quantities[i]);
//     const product = products.find((p) => p.id === Number(id));

//     if (!product) redirect("/error?message=Product with such ID not found");
//     if (quantity <= 0 || sellingPrice <= 0) {
//       redirect("/error?message=Quantity and price must be greater than zero");
//     }

//     return {
//       productId: Number(id),
//       quantity,
//       defaultPrice: product.price,
//       sellingPrice: new Prisma.Decimal(sellingPrice),
//     };
//   });

//   const totalAmount = Math.ceil(
//     orderItems.reduce(
//       (sum, item) => sum + item.sellingPrice.toNumber() * item.quantity,
//       0
//     )
//   );

//   const now = new Date();
//   const year = now.getFullYear().toString().slice(-2);
//   const month = String(now.getMonth() + 1).padStart(2, "0");
//   const day = String(now.getDate()).padStart(2, "0");
//   const randomDigits = Math.floor(10000 + Math.random() * 90000);
//   const invoiceNumber = `INV-${year}${month}${day}-${randomDigits}`;

//   await prisma.$transaction(async (tx) => {
//     await tx.order.create({
//       data: {
//         customerName,
//         status,
//         totalAmount: new Prisma.Decimal(totalAmount),
//         invoiceNumber,
//         items: {
//           create: orderItems,
//         },
//       },
//     });

//     for (const item of orderItems) {
//       await tx.product.update({
//         where: { id: item.productId },
//         data: {
//           stock: {
//             decrement: item.quantity,
//           },
//         },
//       });
//     }
//   });

//   revalidatePath("/orders");
//   redirect("/orders?added=true");
// }


// // only for updateing the status
// export async function updateOrderStatus(formData: FormData) {
//   const orderId = Number(formData.get("orderId"));
//   const newStatus = String(formData.get("status"));

//   if (!orderId || !newStatus)  redirect("/error?message=Invalid form submission");

//     //  throw new Error("Invalid form submission");

//   // Fetch current order with items
//   const order = await prisma.order.findUnique({
//     where: { id: orderId },
//     include: { items: true },
//   });

//   if (!order) redirect("/error?message=Invalid form submission");
//     // throw new Error("Order not found");

//   const oldStatus = order.status;

//   // ✅ Adjust stock if status changes
//   if ((oldStatus === "Pending" || oldStatus === "Completed") && newStatus === "Cancelled") {
//     // Increase stock
//     for (const item of order.items) {
//       await prisma.product.update({
//         where: { id: item.productId },
//         data: { stock: { increment: item.quantity } },
//       });
//     }
//   } else if (oldStatus === "Cancelled" && (newStatus === "Pending" || newStatus === "Completed")) {
//     // Decrease stock
//     for (const item of order.items) {
//       await prisma.product.update({
//         where: { id: item.productId },
//         data: { stock: { decrement: item.quantity } },
//       });
//     }
//   }

//   // ✅ Update order status
//   await prisma.order.update({
//     where: { id: orderId },
//     data: { status: newStatus },
//   });

//   // ✅ Revalidate and redirect
//   revalidatePath("/orders");
//   redirect("/orders?update=true");
// }


// app/actions.ts


// app/actions.ts (append)
'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'// adjust if your gen path differs
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { switchUserOrg } from '../app/org/orgSwitch'

export async function switchOrg(formData: FormData) {
  const { appUser } = await requireUser()

  const orgId   = String(formData.get('orgId') ?? '')
  const passkey = String(formData.get('passkey') ?? '')

  if (!orgId || !passkey) {
    redirect('/error?message=OrgId and passkey required')
  }

  await switchUserOrg(appUser.id, orgId, passkey)

  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/orders')
  redirect('/?orgSwitched=true')
}