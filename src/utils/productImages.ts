/**
 * `images` DB column mein comma-separated URLs store hote hain
 * (e.g. "url1,url2,url3"). Yeh helper usko clean array mein todta hai.
 */
export function parseProductImages(images: string | null | undefined): string[] {
  return (images || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
}

/** List ya grid cards ke liye — pehli image return karta hai, agar koi na ho to null. */
export function getFirstProductImage(images: string | null | undefined): string | null {
  const parsed = parseProductImages(images);
  return parsed.length > 0 ? parsed[0] : null;
}