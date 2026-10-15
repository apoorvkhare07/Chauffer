import type { PreparedPhoto } from "./photos";
export async function choosePhoto(
  _camera = false,
): Promise<PreparedPhoto | null> {
  throw new Error(
    "Photo preparation needs the installed iOS or Android app. Browser preview cannot verify native photo handling.",
  );
}
export async function discardPhoto(_photo?: PreparedPhoto | null) {}
export async function cleanupPhotos() {}
