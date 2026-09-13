import { apiRequest } from "./client";
import { API_ORIGIN } from "./config";

export type Coupon = {
  id: number;
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  usageLimitPerUser: number;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
};

export type CouponApplyResult = {
  code: string;
  discountAmount: number;
  finalAmount: number;
};

const COUPONS_BASE = `${API_ORIGIN}/api`;

export function getActiveCoupons(token: string): Promise<Coupon[]> {
  return apiRequest<Coupon[]>("/coupons", { token, baseUrl: COUPONS_BASE });
}

export function applyCoupon(token: string, code: string, orderAmount: number): Promise<CouponApplyResult> {
  return apiRequest<CouponApplyResult>("/coupons/apply", {
    method: "POST",
    token,
    baseUrl: COUPONS_BASE,
    body: { code, orderAmount },
  });
}