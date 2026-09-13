import { addToCart } from "../api/cart";
import { OrderItem } from "../api/orders";

export type ReorderResult = {
  successCount: number;
  failedCount: number;
  failedItems: string[];
};

/**
 * Order ke saare items ko cart me ek-ek karke add karta hai.
 * Agar koi product ab exist nahi karta (delete ho gaya ho seller ne), to
 * uska sirf wo ek item skip ho jaata hai — baaki items normally add hote hain.
 */
export async function reorderItems(
  token: string,
  items: OrderItem[],
  productNames: Record<number, string>
): Promise<ReorderResult> {
  let successCount = 0;
  const failedItems: string[] = [];

  for (const item of items) {
    try {
      await addToCart(token, item.productId, item.quantity);
      successCount++;
    } catch {
      failedItems.push(productNames[item.productId] || `Product #${item.productId}`);
    }
  }

  return { successCount, failedCount: failedItems.length, failedItems };
}