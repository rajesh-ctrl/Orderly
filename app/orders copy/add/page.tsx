import { prisma } from "@/lib/prisma";
import AddOrderForm from "@/app/orders/add/AddOrderform";

export default async function AddOrderPage() {
  // Fetch products from DB
  const products = await prisma.product.findMany({
    select: { id: true, name: true, price: true },
    orderBy: { name: "asc" },
  });

  // Convert Decimal to number for client
  const serializedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
  }));

  return <AddOrderForm products={serializedProducts} />;
}
