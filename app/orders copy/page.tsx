// import { prisma } from "@/lib/prisma";
// import Link from "next/link";
// import { deleteOrder } from "@/lib/actions"; // Server action for delete
// import { CirclePlus, Pencil, ReceiptText, Trash2 } from "lucide-react";
// import Pagination from "@/components/PaginationClient";
// import PaginationClient from "@/components/PaginationClient";
// // import CustomerFilter from "@/components/CustomerFilter";
// import FilterBar from "@/components/FilterBar";
// // import { useSearchParams } from "next/navigation";

// // export default async function OrdersPage() {
// // const orders = await prisma.order.findMany({
// //   orderBy: { createdAt: "desc" }, // Sort by latest
// // });

// //   const pageSize = 10;
// //   const page = parseInt(useSearchParams.page || "1");
// //   const totalOrders = await prisma.order.count();
// //   const totalPages = Math.ceil(totalOrders / pageSize);

// //   const orders = await prisma.order.findMany({
// //     skip: (page - 1) * pageSize,
// //     take: pageSize,
// //     orderBy: { createdAt: "desc" },
// //   });

// // export default async function OrdersPage({
// //   searchParams,
// // }: {
// //   searchParams: Promise<{ page?: string }>;
// // }) {
// //   const params = await searchParams; // ✅ unwrap the promise
// //   const pageSize = 20;
// //   const page = parseInt(params.page || "1");

// // const totalOrders = await prisma.order.count();
// // const totalPages = Math.ceil(totalOrders / pageSize);

// //   const orders = await prisma.order.findMany({
// //     skip: (page - 1) * pageSize,
// //     take: pageSize,
// //     orderBy: { createdAt: "desc" },
// //   });

// export default async function OrdersPage({
//   searchParams,
// }: {
//   searchParams: Promise<{
//     page?: string;
//     status?: string;
//     customer?: string;
//     dateRange?: string;
//     fromDate?: string;
//     toDate?: string;
//     added?: string;
//     update?: string;
//     delete?: string;
//     month?: string;
//     // createdAt?: string;
//   }>;
// }) {
//   const params = await searchParams;

//   const pageSize = 20;
//   const page = parseInt(params.page || "1");
//   const totalOrders = await prisma.order.count();
//   const totalPages = Math.ceil(totalOrders / pageSize);

//   // const statusFilter = params.status || "";
//   // const customerFilter = params.customer || "";
//   // const fromDate = params.fromDate ? new Date(params.fromDate) : null;
//   // const toDate = params.toDate ? new Date(params.toDate) : null;

//   const where: any = {};
//   if (params.status) where.status = params.status;
//   if (params.customer)
//     where.customerName = { equals: params.customer, mode: "insensitive" };
//   if (params.fromDate && params.toDate) {
//     where.createdAt = {
//       gte: new Date(params.fromDate),
//       lte: new Date(params.toDate),
//     };
//   } else if (params.dateRange === "today") {
//     where.createdAt = { gte: new Date(new Date().setHours(0, 0, 0, 0)) };
//   } else if (params.dateRange === "week") {
//     const startOfWeek = new Date();
//     startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
//     where.createdAt = { gte: startOfWeek };
//   } else if (params.dateRange === "month") {
//     const startOfMonth = new Date(
//       new Date().getFullYear(),
//       new Date().getMonth(),
//       1
//     );
//     where.createdAt = { gte: startOfMonth };
//   }

//   // for month filtered data
//   if (params.month) {
//     const now = new Date();
//     const year = now.getFullYear();

//     // Convert month name (e.g., "Nov") to month index
//     const monthIndex = new Date(`${params.month} 1, ${year}`).getMonth(); // Nov → 10
//     const startDate = new Date(year, monthIndex, 1); // First day of month
//     const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59); // Last day of month

//     where.createdAt = {
//       gte: startDate,
//       lte: endDate,
//     };
//   }

//   // export default async function OrdersPage() {
//   const orders = await prisma.order.findMany({
//     where, // ✅ Apply filters
//     skip: (page - 1) * pageSize,
//     take: pageSize,
//     orderBy: { createdAt: "desc" },
//   });

//   // ✅ Fetch customers for dropdown
//   const customers = await prisma.order.findMany({
//     select: { customerName: true },
//     distinct: ["customerName"],
//   });

//   return (
//     <div className="pl-9 pb-20 ">
//       <br />
//       <div className="flex justify-between w-[90%] px-2 pr-4">
//         <div>
//           <h1 className="text-xl font-bold pb-2 hidden xl:flex">Order List</h1>
//           <p className="text-gray-600 text-xs lg:text-sm hidden xl:flex">
//             Manage your the status and generate invoice
//           </p>
//         </div>

//         <FilterBar customers={customers.map((c) => c.customerName || "")} />

//         <Link
//           href="/orders/add"
//           className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors
//              focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:pointer-events-none disabled:opacity-50
//              border border-gray-300 bg-white shadow-sm hover:bg-gray-100 hover:text-gray-800
//              h-8 rounded-md px-3 mt-3 text-xs "
//         >
//           <CirclePlus className="w-5 h-5 text-gray-400 hover:text-cyan-400" />
//           New Order
//         </Link>
//       </div>

//       <br />

//       {params.added === "true" && (
//         <div className="mb-4 mt-4 bg-green-100 text-green-800 px-4 py-2 rounded w-[90%]">
//           ✅ Order added successfully!
//         </div>
//       )}

//       {params.update === "true" && (
//         <div className="mb-4 mt-4 bg-green-100 text-green-800 px-4 py-2 rounded w-[90%]">
//           ✅ Order updated successfully!
//         </div>
//       )}

//       {params.delete === "true" && (
//         <div className="mb-4 mt-4 bg-red-100 text-red-800 px-4 py-2 rounded w-[90%]">
//           🗑️ Order deleted successfully! Cannot be retrieved!!
//         </div>
//       )}

//       <div className="flex flex-col min-h-screen ">
//         {/* Table Container */}
//         <div className="flex-1 overflow-x-auto p-6 pb-24">
//           {/* <div className="flex-1 overflow-x-auto p-6 pb-24">  */}

//           <table className="table-auto border-collapse border border-gray-300 w-[90%] text-sm font-mono">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
//                   ID <span className="text-gray-400 text-xs">int4</span>
//                 </th>
//                 <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
//                   Invoice <span className="text-gray-400 text-xs">text</span>
//                 </th>
//                 <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
//                   Date <span className="text-gray-400 text-xs">timestamp</span>
//                 </th>
//                 <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
//                   Customer <span className="text-gray-400 text-xs">text</span>
//                 </th>
//                 <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
//                   Total <span className="text-gray-400 text-xs">numeric</span>
//                 </th>
//                 <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
//                   Status <span className="text-gray-400 text-xs">text</span>
//                 </th>
//                 <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-600">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="font-mono text-sm">
//               {orders.map((order) => (
//                 <tr
//                   key={order.id}
//                   className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
//                 >
//                   <td className="border border-gray-300 px-4 py-2">
//                     {order.id}
//                   </td>
//                   <td className="border border-gray-300 px-4 py-2">
//                     {order.invoiceNumber}
//                   </td>
//                   <td className="border border-gray-300 px-4 py-2">
//                     {order.createdAt.toISOString().slice(0, 10)}
//                   </td>
//                   <td className="border border-gray-300 px-4 py-2">
//                     {order.customerName}
//                   </td>
//                   <td className="border border-gray-300 px-4 py-2">
//                     ₹{Number(order.totalAmount).toFixed(2)}
//                   </td>

//                   <td className="border  border-gray-300  px-4 py-2">
//                     {order.status === "Pending" && (
//                       <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
//                         Pending
//                       </span>
//                     )}
//                     {order.status === "Completed" && (
//                       <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
//                         Completed
//                       </span>
//                     )}
//                     {order.status === "Cancelled" && (
//                       <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
//                         Cancelled
//                       </span>
//                     )}
//                   </td>

//                   <td className="border border-gray-300 px-2  w-40 text-centre ">
//                     <div className="flex justify-evenly space-x-2">
//                       {/* Update Button */}
//                       <Link
//                         href={`/orders/update/${order.id}`}
//                         className="inline-flex items-center text-blue-400 hover:bg-blue-100 hover:text-blue-800 p-1 rounded transition relative group "
//                       >
//                         <Pencil className="w-5 h-5" />
//                         {/* Tooltip */}
//                         <span className="absolute bottom-full  ml-6 mt-2 left-full transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition">
//                           Edit
//                         </span>
//                       </Link>

//                       {/* View Items Button */}
//                       <Link
//                         href={`/orderitems/${order.id}`}
//                         className="inline-flex items-center text-cyan-400 hover:bg-cyan-50 hover:text-cyan-800 p-1 rounded transition relative group"
//                       >
//                         <ReceiptText className="w-5 h-5" />
//                         {/* Tooltip */}
//                         <span className="absolute bottom-full  ml-6 mt-2 left-full transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition">
//                           Invoice
//                         </span>
//                       </Link>

//                       {/* Delete Button */}

//                       <form action={deleteOrder} className="inline">
//                         <input type="hidden" name="id" value={order.id} />
//                         <button
//                           type="submit"
//                           className="cursor-pointer inline-flex items-center text-gray-400 hover:bg-red-50 hover:text-red-800 p-1 rounded transition relative group"
//                         >
//                           <Trash2 className="w-5 h-5" />
//                           {/* Tooltip */}
//                           <span className="absolute bottom-full  ml-6 mt-2 left-full transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition">
//                             Delete
//                           </span>
//                         </button>
//                       </form>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>{" "}
//       </div>
//       {/* Pagination */}

//       <PaginationClient currentPage={page} totalPages={totalPages} />
//     </div>
//   );
// }
