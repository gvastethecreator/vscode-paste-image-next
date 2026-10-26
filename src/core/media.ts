export type SupportedImageMime = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export interface ImageMedia {
  readonly extension: ".jpeg" | ".jpg" | ".png" | ".webp" | ".gif";
  readonly mime: SupportedImageMime;
}

export type MediaErrorCode =
  | "empty"
  | "mime-mismatch"
  | "too-large"
  | "unsupported";

export class MediaError extends Error {
  readonly code: MediaErrorCode;

  constructor(
    code: MediaErrorCode,
    message: string,
  ) {
    super(message);
    this.code = code;
    this.name = "MediaError";
  }
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_EXTENSIONS = new Set([".jpeg", ".jpg"]);

export function isPotentialImage(mime: string, fileName: string): boolean {
  const normalizedMime = normalizeMime(mime);
  return normalizedMime === "image/png"
    || normalizedMime === "image/jpeg"
    || normalizedMime === "image/jpg"
    || normalizedMime === "image/webp"
    || normalizedMime === "image/gif"
    || (!normalizedMime.startsWith("image/") && isSupportedExtension(extensionOf(fileName)));
}

export function validateImage(
  bytes: Uint8Array,
  declaredMime: string | undefined,
  sourceName: string,
  maximumBytes: number,
): ImageMedia {
  if (bytes.byteLength === 0) {
    throw new MediaError("empty", "The clipboard image is empty.");
  }
  if (bytes.byteLength > maximumBytes) {
    throw new MediaError("too-large", "The clipboard image exceeds the configured size limit.");
  }

  const detected = detectImage(bytes);
  if (!detected) {
    throw new MediaError("unsupported", "The clipboard data is not a supported PNG, JPEG, WebP or GIF image.");
  }

  const normalizedMime = declaredMime ? normalizeMime(declaredMime) : undefined;
  const declared = normalizedMime === "image/jpg" ? "image/jpeg" : normalizedMime;
  if (declared && declared !== "files" && !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(declared)) {
    throw new MediaError("unsupported", "The clipboard MIME type is not supported.");
  }
  if (declared && declared !== "files" && declared !== detected.mime) {
    throw new MediaError("mime-mismatch", "The clipboard MIME type does not match the image bytes.");
  }

  const sourceExtension = extensionOf(sourceName);
  if (isSupportedExtension(sourceExtension)
    && mediaForExtension(sourceExtension) !== detected.mime) {
    throw new MediaError("mime-mismatch", "The clipboard file extension does not match the image bytes.");
  }

  if (detected.mime === "image/png") {
    return { extension: ".png", mime: "image/png" };
  }
  if (detected.mime === "image/webp") return { extension: ".webp", mime: "image/webp" };
  if (detected.mime === "image/gif") return { extension: ".gif", mime: "image/gif" };
  return {
    extension: sourceExtension === ".jpeg" ? ".jpeg" : ".jpg",
    mime: "image/jpeg",
  };
}

function detectImage(bytes: Uint8Array): Pick<ImageMedia, "mime"> | undefined {
  const ascii = (start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length));
  if (bytes.length >= 13 && ["GIF87a", "GIF89a"].includes(ascii(0, 6)) &&
    (bytes[6] !== 0 || bytes[7] !== 0) && (bytes[8] !== 0 || bytes[9] !== 0)) {
    return { mime: "image/gif" };
  }
  if (bytes.length >= 20 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP" &&
    ["VP8 ", "VP8L", "VP8X"].includes(ascii(12, 4)) &&
    new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, true) === bytes.length - 8) {
    return { mime: "image/webp" };
  }
  if (
    bytes.byteLength >= PNG_SIGNATURE.length
    && PNG_SIGNATURE.every((value, index) => bytes[index] === value)
  ) {
    return { mime: "image/png" };
  }
  if (
    bytes.byteLength >= 4
    && bytes[0] === 0xff
    && bytes[1] === 0xd8
    && bytes[2] === 0xff
  ) {
    return { mime: "image/jpeg" };
  }
  return undefined;
}

function extensionOf(fileName: string): string {
  const match = /(\.[A-Za-z0-9]+)$/.exec(fileName.trim());
  return match?.[1]?.toLowerCase() ?? "";
}

function isSupportedExtension(extension: string): boolean {
  return extension === ".png" || extension === ".webp" || extension === ".gif" || JPEG_EXTENSIONS.has(extension);
}

function mediaForExtension(extension: string): SupportedImageMime | undefined {
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  if (extension === ".gif") return "image/gif";
  if (JPEG_EXTENSIONS.has(extension)) return "image/jpeg";
  return undefined;
}

function normalizeMime(mime: string): string {
  return mime.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}
