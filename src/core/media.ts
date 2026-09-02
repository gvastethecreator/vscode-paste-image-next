export type SupportedImageMime = "image/jpeg" | "image/png";

export interface ImageMedia {
  readonly extension: ".jpeg" | ".jpg" | ".png";
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
    throw new MediaError("unsupported", "The clipboard data is not a supported PNG or JPEG image.");
  }

  const normalizedMime = declaredMime ? normalizeMime(declaredMime) : undefined;
  const declared = normalizedMime === "image/jpg" ? "image/jpeg" : normalizedMime;
  if (declared && declared !== "files" && declared !== "image/png" && declared !== "image/jpeg") {
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
  return {
    extension: sourceExtension === ".jpeg" ? ".jpeg" : ".jpg",
    mime: "image/jpeg",
  };
}

function detectImage(bytes: Uint8Array): Pick<ImageMedia, "mime"> | undefined {
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
  return extension === ".png" || JPEG_EXTENSIONS.has(extension);
}

function mediaForExtension(extension: string): SupportedImageMime | undefined {
  if (extension === ".png") return "image/png";
  if (JPEG_EXTENSIONS.has(extension)) return "image/jpeg";
  return undefined;
}

function normalizeMime(mime: string): string {
  return mime.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}
