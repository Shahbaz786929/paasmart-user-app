import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getInvoiceUrl } from "../api/invoice";
import { getAuthToken } from "./authStorage";

export async function downloadInvoice(orderId: number): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error("You must be logged in to download the invoice.");

  const fileUri = FileSystem.cacheDirectory + `invoice-order-${orderId}.pdf`;

  const result = await FileSystem.downloadAsync(getInvoiceUrl(orderId), fileUri, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (result.status !== 200) {
    throw new Error("Could not download invoice. Please try again.");
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(result.uri, {
      mimeType: "application/pdf",
      dialogTitle: `Invoice - Order #${orderId}`,
      UTI: "com.adobe.pdf",
    });
  }
}