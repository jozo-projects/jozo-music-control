export type ImageSize = "thumb" | "cart" | "card" | "full";

const SIZE_WIDTH: Record<ImageSize, number> = {
  thumb: 96,
  cart: 240,
  card: 400,
  full: 800,
};

/**
 * Tối ưu URL ảnh (Cloudinary): WebP/AVIF tự động, nén, giới hạn chiều rộng.
 * URL không phải Cloudinary được trả về nguyên bản.
 */
export function optimizeImageUrl(
  url: string | undefined | null,
  size: ImageSize = "card",
): string {
  if (!url) return "";

  const cloudinaryMarker = "/image/upload/";
  const markerIndex = url.indexOf(cloudinaryMarker);
  if (markerIndex === -1) return url;

  const prefix = url.slice(0, markerIndex + cloudinaryMarker.length);
  let rest = url.slice(markerIndex + cloudinaryMarker.length);

  // Bỏ transform cũ nếu đã có (tránh chồng transform)
  // VD: f_auto,q_auto,w_400/v123/... hoặc w_400,c_fill/folder/...
  if (/^[^/]+,/.test(rest) || /^(f_|q_|w_|c_|dpr_)/.test(rest)) {
    const slash = rest.indexOf("/");
    if (slash !== -1) {
      rest = rest.slice(slash + 1);
    }
  }

  const width = SIZE_WIDTH[size];
  const transform = `f_auto,q_auto:eco,w_${width},c_limit`;

  return `${prefix}${transform}/${rest}`;
}
