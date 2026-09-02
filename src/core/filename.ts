export interface FilenameContext {
  readonly date: string;
  readonly documentName: string;
  readonly requestedName?: string;
  readonly time: string;
}

export class FilenameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FilenameError";
  }
}

const MAX_TEMPLATE_LENGTH = 128;
const MAX_STEM_LENGTH = 96;
const WINDOWS_RESERVED = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
const ALLOWED_TOKENS = new Set(["counter", "date", "documentName", "name", "time"]);

export function buildFilename(
  template: string,
  context: FilenameContext,
  extension: ".jpeg" | ".jpg" | ".png",
  attempt: number,
): string {
  if (!Number.isInteger(attempt) || attempt < 1) {
    throw new FilenameError("The filename attempt must be a positive integer.");
  }
  validateTemplate(template);

  const values: Readonly<Record<string, string>> = {
    counter: String(attempt),
    date: context.date,
    documentName: stripExtension(context.documentName),
    name: context.requestedName ?? "image",
    time: context.time,
  };
  let expanded = template.replace(/\$\{([^}]+)\}/g, (_match, token: string) => {
    if (!ALLOWED_TOKENS.has(token)) {
      throw new FilenameError(`Unsupported filename token: \${${token}}.`);
    }
    return values[token] ?? "";
  });
  if (expanded.includes("${")) {
    throw new FilenameError("The filename template contains an incomplete token.");
  }

  expanded = stripKnownImageExtension(expanded);
  const normalizedStem = normalizeStem(expanded);
  let stem = trimStem(normalizedStem);
  if (attempt > 1 && (
    !template.includes("${counter}")
    || Array.from(normalizedStem).length > MAX_STEM_LENGTH
  )) {
    stem = appendCollisionSuffix(stem, attempt);
  }
  return `${stem}${extension}`;
}

export function sanitizeStem(value: string): string {
  return trimStem(normalizeStem(value));
}

function normalizeStem(value: string): string {
  let stem = value
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.\- ]+|[.\- ]+$/g, "");
  if (!stem) stem = "image";
  if (WINDOWS_RESERVED.test(stem)) stem = `image-${stem}`;
  return stem;
}

export function validateRequestedStem(value: string): string | undefined {
  if (!value.trim()) return "Enter a file name.";
  if (value.length > MAX_STEM_LENGTH) return `Use ${MAX_STEM_LENGTH} characters or fewer.`;
  if (/[\u0000-\u001f\u007f<>:"/\\|?*]/.test(value)) {
    return "Do not use path separators, control characters, or reserved punctuation.";
  }
  if (/[. ]$/.test(value)) return "Do not end the name with a dot or space.";
  if (WINDOWS_RESERVED.test(stripKnownImageExtension(value.trim()))) {
    return "This file name is reserved on Windows.";
  }
  return undefined;
}

function validateTemplate(template: string): void {
  if (!template.trim()) throw new FilenameError("The filename template is empty.");
  if (template.length > MAX_TEMPLATE_LENGTH) {
    throw new FilenameError(`The filename template exceeds ${MAX_TEMPLATE_LENGTH} characters.`);
  }
  if (/[\u0000-\u001f\u007f/\\]/.test(template)) {
    throw new FilenameError("The filename template must not contain path separators or control characters.");
  }
}

function stripKnownImageExtension(value: string): string {
  return value.replace(/\.(?:jpe?g|png)$/i, "");
}

function stripExtension(value: string): string {
  return value.replace(/\.[^.]*$/, "");
}

function trimStem(value: string): string {
  return Array.from(value).slice(0, MAX_STEM_LENGTH).join("").replace(/[.\- ]+$/g, "") || "image";
}

function appendCollisionSuffix(stem: string, attempt: number): string {
  const suffix = `-${attempt}`;
  const maximumBaseLength = MAX_STEM_LENGTH - Array.from(suffix).length;
  const base = Array.from(stem)
    .slice(0, maximumBaseLength)
    .join("")
    .replace(/[.\- ]+$/g, "") || "image";
  return `${base}${suffix}`;
}
