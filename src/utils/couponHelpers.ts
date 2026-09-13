import { Coupon } from "../api/coupons";

export function getDiscountLabel(coupon: Coupon): string {
  if (coupon.discountType === "FLAT") {
    return `Flat ₹${coupon.discountValue} OFF`;
  }
  const cap = coupon.maxDiscountAmount ? ` up to ₹${coupon.maxDiscountAmount}` : "";
  return `${coupon.discountValue}% OFF${cap}`;
}

export function getMinOrderLabel(coupon: Coupon): string | null {
  if (!coupon.minOrderAmount || coupon.minOrderAmount <= 0) return null;
  return `On orders above ₹${coupon.minOrderAmount}`;
}

export function getExpiryLabel(coupon: Coupon): string | null {
  if (!coupon.validUntil) return null;
  const date = new Date(coupon.validUntil);
  return `Valid till ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
}