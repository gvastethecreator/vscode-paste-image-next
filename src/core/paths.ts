export type PathStyle = "documentRelative" | "workspaceRelative";

export interface DestinationInput {
  readonly documentPath: string;
  readonly template: string;
  readonly workspacePath?: string;
}

export class PathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathError";
  }
}

const MAX_DESTINATION_LENGTH = 160;
const MAX_SEGMENT_LENGTH = 128;
const WINDOWS_RESERVED = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

export function dirnameUriPath(value: string): string {
  const normalized = normalizeAbsolutePath(value);
  const index = normalized.lastIndexOf("/");
  return index <= 0 ? "/" : normalized.slice(0, index);
}

export function basenameUriPath(value: string): string {
  const normalized = normalizeAbsolutePath(value);
  return normalized.slice(normalized.lastIndexOf("/") + 1);
}

export function resolveDestinationPath(input: DestinationInput): string {
  const documentDirectory = dirnameUriPath(input.documentPath);
  const workspacePath = input.workspacePath
    ? normalizeAbsolutePath(input.workspacePath)
    : undefined;
  let remaining = input.template.trim().replaceAll("\\", "/");
  if (!remaining) throw new PathError("The destination setting is empty.");
  if (remaining.length > MAX_DESTINATION_LENGTH) {
    throw new PathError(`The destination setting exceeds ${MAX_DESTINATION_LENGTH} characters.`);
  }

  let root = documentDirectory;
  let usedRootToken = false;
  if (remaining.startsWith("${workspaceFolder}")) {
    if (!workspacePath) {
      throw new PathError("The destination needs a workspace folder.");
    }
    root = workspacePath;
    remaining = remaining.slice("${workspaceFolder}".length);
    usedRootToken = true;
  } else if (remaining.startsWith("${documentDir}")) {
    remaining = remaining.slice("${documentDir}".length);
    usedRootToken = true;
  } else if (remaining.includes("${workspaceFolder}") || remaining.includes("${documentDir}")) {
    throw new PathError("A destination root token must be at the start of the setting.");
  }

  const documentName = basenameUriPath(input.documentPath).replace(/\.[^.]*$/, "");
  remaining = remaining.replaceAll("${documentName}", documentName);
  if (remaining.includes("${")) {
    throw new PathError("The destination setting contains an unsupported token.");
  }
  if (!usedRootToken && remaining.startsWith("/")) {
    throw new PathError("The destination setting must not be an absolute path.");
  }
  remaining = remaining.replace(/^\/+/, "");
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(remaining)) {
    throw new PathError("The destination setting must not contain a URI scheme.");
  }

  const segments = remaining.split("/").filter((segment) => segment && segment !== ".");
  for (const segment of segments) validateDirectorySegment(segment);
  const destination = joinUriPath(root, ...segments);
  const allowedRoot = workspacePath && isWithinPath(input.documentPath, workspacePath)
    ? workspacePath
    : documentDirectory;
  if (!isWithinPath(destination, allowedRoot)) {
    throw new PathError("The destination must remain inside the active workspace or document directory.");
  }
  return destination;
}

export function createReferencePath(
  documentPath: string,
  assetPath: string,
  style: PathStyle,
  workspacePath?: string,
): string {
  const documentDirectory = dirnameUriPath(documentPath);
  const normalizedAsset = normalizeAbsolutePath(assetPath);
  if (style === "workspaceRelative") {
    if (!workspacePath) throw new PathError("Workspace-relative paths need a workspace folder.");
    const relative = relativeUriPath(normalizeAbsolutePath(workspacePath), normalizedAsset);
    if (relative.startsWith("../")) {
      throw new PathError("The asset is outside the workspace folder.");
    }
    return `/${encodePath(relative)}`;
  }
  const relative = relativeUriPath(documentDirectory, normalizedAsset);
  const encoded = encodePath(relative);
  return encoded.startsWith("../") ? encoded : `./${encoded}`;
}

export function joinUriPath(root: string, ...segments: string[]): string {
  const normalizedRoot = normalizeAbsolutePath(root).replace(/\/$/, "");
  const suffix = segments.filter(Boolean).join("/");
  return normalizeAbsolutePath(suffix ? `${normalizedRoot}/${suffix}` : normalizedRoot || "/");
}

export function relativeUriPath(fromDirectory: string, target: string): string {
  const from = splitPath(normalizeAbsolutePath(fromDirectory));
  const to = splitPath(normalizeAbsolutePath(target));
  const fromDrive = from[0];
  const toDrive = to[0];
  let caseInsensitive = false;
  if (isWindowsDrive(fromDrive) || isWindowsDrive(toDrive)) {
    if (!fromDrive || !toDrive || fromDrive.toLowerCase() !== toDrive.toLowerCase()) {
      throw new PathError("The document and asset are on different drives.");
    }
    caseInsensitive = true;
  }
  let shared = 0;
  while (
    shared < from.length
    && shared < to.length
    && segmentsEqual(from[shared], to[shared], caseInsensitive)
  ) {
    shared += 1;
  }
  const parts = [
    ...Array.from({ length: from.length - shared }, () => ".."),
    ...to.slice(shared),
  ];
  return parts.join("/") || ".";
}

function validateDirectorySegment(segment: string): void {
  if (segment === "..") throw new PathError("The destination must not contain parent traversal.");
  if (segment.length > MAX_SEGMENT_LENGTH) {
    throw new PathError(`A destination segment exceeds ${MAX_SEGMENT_LENGTH} characters.`);
  }
  if (/[\u0000-\u001f\u007f<>:"|?*]/.test(segment) || /[. ]$/.test(segment)) {
    throw new PathError("The destination contains an invalid path segment.");
  }
  if (WINDOWS_RESERVED.test(segment)) {
    throw new PathError("The destination contains a Windows reserved name.");
  }
}

function normalizeAbsolutePath(value: string): string {
  const source = value.replaceAll("\\", "/");
  const output: string[] = [];
  for (const segment of source.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") output.pop();
    else output.push(segment);
  }
  return `/${output.join("/")}`;
}

function splitPath(value: string): string[] {
  return value.split("/").filter(Boolean);
}

function isWindowsDrive(value: string | undefined): boolean {
  return value !== undefined && /^[A-Za-z]:$/.test(value);
}

function segmentsEqual(left: string, right: string, caseInsensitive: boolean): boolean {
  return caseInsensitive ? left.toLowerCase() === right.toLowerCase() : left === right;
}

function isWithinPath(value: string, root: string): boolean {
  let normalizedValue = normalizeAbsolutePath(value);
  let normalizedRoot = normalizeAbsolutePath(root).replace(/\/$/, "");
  if (/^\/[A-Za-z]:(?:\/|$)/.test(normalizedValue) && /^\/[A-Za-z]:(?:\/|$)/.test(normalizedRoot)) {
    normalizedValue = normalizedValue.toLowerCase();
    normalizedRoot = normalizedRoot.toLowerCase();
  }
  return normalizedValue === normalizedRoot || normalizedValue.startsWith(`${normalizedRoot}/`);
}

function encodePath(value: string): string {
  return value
    .split("/")
    .map((segment) => segment === "." || segment === ".." ? segment : encodeSegment(segment))
    .join("/");
}

function encodeSegment(segment: string): string {
  return encodeURIComponent(segment).replace(/[!'()*]/g, (character) => (
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  ));
}
