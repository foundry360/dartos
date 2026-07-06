/** Accept string for mobile-friendly image pickers (includes iOS HEIC). */
export const IMAGE_FILE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif";

const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|gif|heic|heif)$/i;

/** iOS often omits MIME type for HEIC photos picked from the library. */
export function isImageFile(file: File) {
  if (file.type.startsWith("image/")) {
    return true;
  }

  return IMAGE_EXTENSION_PATTERN.test(file.name);
}
