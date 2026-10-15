import * as Picker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Directory, File, Paths } from "expo-file-system";
import { resizeTarget, validateJpeg, validateSource } from "../core/photos";

export type PreparedPhoto = { uri: string; jpegBase64: string; bytes: number };
const photoDirectory = () =>
  new Directory(Paths.cache, "chauffer-photo-drafts");
export async function cleanupPhotos() {
  try {
    const directory = photoDirectory();
    if (directory.exists) directory.delete();
  } catch {
    /* OS may have cleared the cache already. */
  }
}
export async function discardPhoto(photo?: PreparedPhoto | null) {
  if (!photo) return;
  try {
    const file = new File(photo.uri);
    if (file.exists) file.delete();
  } catch {
    /* Best effort for OS cache files. */
  }
}
export async function choosePhoto(
  camera = false,
): Promise<PreparedPhoto | null> {
  if (camera) {
    const permission = await Picker.requestCameraPermissionsAsync();
    if (!permission.granted)
      throw new Error(
        "Camera access is off. Choose from your photos instead, or enable the camera in Settings.",
      );
  }
  const options: Picker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
    exif: false,
    base64: false,
  };
  // The system library picker grants access to the selected photo only.
  const result = camera
    ? await Picker.launchCameraAsync(options)
    : await Picker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;
  return preparePhoto(result.assets[0]);
}
async function preparePhoto(
  asset: Picker.ImagePickerAsset,
): Promise<PreparedPhoto> {
  const source = new File(asset.uri);
  let context: ReturnType<typeof ImageManipulator.manipulate> | undefined;
  let rendered:
    | Awaited<
        ReturnType<
          ReturnType<typeof ImageManipulator.manipulate>["renderAsync"]
        >
      >
    | undefined;
  try {
    validateSource(asset.fileSize ?? source.size, asset.width, asset.height);
    context = ImageManipulator.manipulate(asset.uri);
    context.resize(resizeTarget(asset.width, asset.height));
    rendered = await context.renderAsync();
    for (const compress of [0.82, 0.62, 0.42]) {
      const output = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress,
        base64: true,
      });
      try {
        const jpegBase64 = output.base64 ?? "";
        const bytes = validateJpeg(jpegBase64);
        const directory = photoDirectory();
        if (!directory.exists) directory.create({ intermediates: true });
        const destination = new File(directory, `garment-${Date.now()}.jpg`);
        new File(output.uri).move(destination);
        return { uri: destination.uri, jpegBase64, bytes };
      } catch (e) {
        const file = new File(output.uri);
        if (file.exists) file.delete();
        if (compress === 0.42) throw e;
      }
    }
    throw new Error("Choose a smaller photo.");
  } finally {
    rendered?.release();
    context?.release();
    // Delete only picker-owned cache copies, never the user's library original.
    try {
      if (asset.uri.startsWith(Paths.cache.uri) && source.exists)
        source.delete();
    } catch {
      /* Cache cleanup must not discard a successful conversion. */
    }
  }
}
