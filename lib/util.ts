
export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `INV-${year}-${month}-${day}-${randomDigits}`;
}
