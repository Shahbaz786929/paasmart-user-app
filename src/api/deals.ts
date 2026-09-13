import { apiRequest } from "./client";
import { API_ORIGIN } from "./config";

export type ActiveDeal = {
  flashSaleId: number;
  productId: number;
  productName: string;
  productImage: string | null;
  originalPrice: number;
  dealPrice: number;
  discountPercent: number;
  endsAt: string;
};

const DEALS_BASE = `${API_ORIGIN}/api`;

// Tenant-scoping JWT token se hoti hai (JwtAuthFilter), isliye "public" hone ke
// bawajood token bhejna zaroori hai taaki backend sahi city ki deals de
export function getLiveDeals(token: string | null): Promise<ActiveDeal[]> {
  return apiRequest<ActiveDeal[]>("/deals/live", { token, baseUrl: DEALS_BASE });
}