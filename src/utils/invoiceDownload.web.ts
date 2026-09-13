import { getInvoiceUrl } from "../api/invoice";
import { getAuthToken } from "./authStorage";


export async function downloadInvoice(orderId: number): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error("You must be logged in to download the invoice.");

  const response = await fetch(getInvoiceUrl(orderId), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Could not download invoice. Please try again.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `invoice-order-${orderId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}