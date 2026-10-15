import { jpegPhoto, PHOTO_ACCEPT } from "../../../app/photoUpload.js";
import { validateJpeg } from "../core/photos";
import type { PreparedPhoto } from "./photos";

const previews = new Set<string>();
export async function choosePhoto(
  camera = false,
): Promise<PreparedPhoto | null> {
  const file = await new Promise<File | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = PHOTO_ACCEPT;
    if (camera) input.setAttribute("capture", "environment");
    input.style.display = "none";
    document.body.append(input);
    const finish = (file: File | null) => {
      input.remove();
      resolve(file);
    };
    input.onchange = () => finish(input.files?.[0] ?? null);
    input.oncancel = () => finish(null);
    input.click();
  });
  if (!file) return null;
  const jpegBase64 = await jpegPhoto(file);
  const bytes = validateJpeg(jpegBase64);
  const data = Uint8Array.from(atob(jpegBase64), (char) => char.charCodeAt(0));
  const uri = URL.createObjectURL(new Blob([data], { type: "image/jpeg" }));
  previews.add(uri);
  return { uri, jpegBase64, bytes };
}
export async function discardPhoto(photo?: PreparedPhoto | null) {
  if (photo && previews.delete(photo.uri)) URL.revokeObjectURL(photo.uri);
}
export async function cleanupPhotos() {
  for (const uri of previews) URL.revokeObjectURL(uri);
  previews.clear();
}
