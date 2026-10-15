export const SOURCE_LIMIT = 12 * 1024 * 1024;
export const JPEG_LIMIT = 700_000;
export function validateSource(
  bytes?: number,
  width?: number,
  height?: number,
) {
  if (bytes !== undefined && bytes > SOURCE_LIMIT)
    throw new Error("Choose a photo smaller than 12 MB.");
  if (
    !width ||
    !height ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    throw new Error("This photo could not be read. Choose another photo.");
}
export function jpegBytes(base64: string) {
  if (
    !base64.startsWith("/9j/") ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(base64) ||
    base64.length % 4 !== 0
  )
    throw new Error(
      "The photo could not be converted to JPEG. Choose another photo.",
    );
  return (
    (base64.length * 3) / 4 -
    (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0)
  );
}
export function validateJpeg(base64: string) {
  const bytes = jpegBytes(base64);
  if (base64.length > 930_000 || bytes > JPEG_LIMIT)
    throw new Error(
      "This photo is still too large. Try a closer crop or another photo.",
    );
  return bytes;
}
export function resizeTarget(width: number, height: number, longest = 1000) {
  const scale = Math.min(1, longest / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
