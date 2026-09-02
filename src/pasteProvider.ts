import * as vscode from "vscode";
import {
  buildFilename,
  FilenameError,
  sanitizeStem,
  validateRequestedStem,
} from "./core/filename.ts";
import {
  automaticFormatForLanguage,
  explicitFormatForLanguage,
  formatReference,
  formatSupportsAltText,
  pasteTitle,
  type ReferenceFormat,
} from "./core/formatters.ts";
import {
  isPotentialImage,
  MediaError,
  validateImage,
  type ImageMedia,
} from "./core/media.ts";
import {
  basenameUriPath,
  createReferencePath,
  joinUriPath,
  PathError,
  resolveDestinationPath,
  type PathStyle,
} from "./core/paths.ts";

const BASE_KIND = vscode.DocumentDropOrPasteEditKind.Empty.append("pasteImageNext", "image");
const DETAILS_KIND = BASE_KIND.append("details");
const PATH_KIND = BASE_KIND.append("path");
const PATH_DETAILS_KIND = PATH_KIND.append("details");
const MARKDOWN_IMAGE_KIND = vscode.DocumentDropOrPasteEditKind.Empty.append("markdown", "link", "image");
const DEFAULT_DESTINATION = "${documentDir}/assets";
const DEFAULT_FILENAME = "image-${date}-${time}";
const MAX_COLLISION_ATTEMPTS = 100;
const MAX_FILE_URI_PATH = 240;
const MAX_OTHER_URI_PATH = 1_024;
const MEBIBYTE = 1024 * 1024;

export const PASTE_EDIT_KINDS = [BASE_KIND, DETAILS_KIND, PATH_KIND, PATH_DETAILS_KIND] as const;

interface ImageCandidate {
  readonly declaredMime?: string;
  readonly file: vscode.DataTransferFile;
}

interface PasteSettings {
  readonly askForName: boolean;
  readonly destination: string;
  readonly filename: string;
  readonly markdownEnabled: boolean;
  readonly maximumBytes: number;
  readonly pathStyle: PathStyle;
}

interface PendingPaste {
  readonly bytes: Uint8Array;
  readonly details: boolean;
  readonly documentUri: vscode.Uri;
  readonly documentVersion: number;
  readonly format: ReferenceFormat;
  readonly media: ImageMedia;
}

class PendingPasteEdit extends vscode.DocumentPasteEdit {
  constructor(
    title: string,
    kind: vscode.DocumentDropOrPasteEditKind,
    readonly pending: PendingPaste,
  ) {
    super("", title, kind);
  }
}

export class PasteImageProvider implements vscode.DocumentPasteEditProvider<PendingPasteEdit> {
  readonly #resolutions = new WeakMap<PendingPasteEdit, Promise<PendingPasteEdit>>();

  async provideDocumentPasteEdits(
    document: vscode.TextDocument,
    ranges: readonly vscode.Range[],
    dataTransfer: vscode.DataTransfer,
    context: vscode.DocumentPasteEditContext,
    token: vscode.CancellationToken,
  ): Promise<PendingPasteEdit[] | undefined> {
    if (token.isCancellationRequested || ranges.length === 0) return undefined;
    const candidate = selectImageCandidate(dataTransfer);
    if (!candidate) return undefined;

    try {
      const settings = readSettings(document.uri);
      const isPasteAs = context.triggerKind === vscode.DocumentPasteTriggerKind.PasteAs;
      const format = isPasteAs
        ? explicitFormatForLanguage(document.languageId)
        : automaticFormatForLanguage(document.languageId, settings.markdownEnabled);
      if (!format) return undefined;

      const requestedDetails = isPasteAs ? [false, true] : [false];
      const matchingDetails = context.only
        ? requestedDetails.filter((details) => context.only!.contains(kindFor(format, details)))
        : requestedDetails;
      if (matchingDetails.length === 0) return undefined;

      assertWritableDocument(document);
      const documentVersion = document.version;
      throwIfCancelled(token);
      const bytes = await candidate.file.data();
      throwIfCancelled(token);
      const media = validateImage(
        bytes,
        candidate.declaredMime,
        candidate.file.name,
        settings.maximumBytes,
      );
      return matchingDetails.map((details) => {
        const edit = new PendingPasteEdit(
          pasteTitle(format, details),
          kindFor(format, details),
          {
            bytes,
            details,
            documentUri: document.uri,
            documentVersion,
            format,
            media,
          },
        );
        if (format === "markdown" && !isPasteAs) edit.yieldTo = [MARKDOWN_IMAGE_KIND];
        return edit;
      });
    } catch (error: unknown) {
      if (error instanceof vscode.CancellationError || token.isCancellationRequested) return undefined;
      void vscode.window.showErrorMessage(userMessage(error));
      return undefined;
    }
  }

  resolveDocumentPasteEdit(
    edit: PendingPasteEdit,
    token: vscode.CancellationToken,
  ): Promise<PendingPasteEdit> {
    const existing = this.#resolutions.get(edit);
    if (existing) return existing;
    const resolution = this.#resolve(edit, token).catch((error: unknown) => {
      this.#resolutions.delete(edit);
      throw error;
    });
    this.#resolutions.set(edit, resolution);
    return resolution;
  }

  async #resolve(edit: PendingPasteEdit, token: vscode.CancellationToken): Promise<PendingPasteEdit> {
    try {
      throwIfCancelled(token);
      const document = vscode.workspace.textDocuments.find(
        (candidate) => candidate.uri.toString() === edit.pending.documentUri.toString(),
      );
      if (!document || document.isClosed || document.version !== edit.pending.documentVersion) {
        throw new PasteError("stale", "The document changed before the paste edit was ready.");
      }
      const settings = readSettings(document.uri);
      assertWritableDocument(document);

      if (edit.pending.bytes.byteLength > settings.maximumBytes) {
        throw new MediaError("too-large", "The clipboard image exceeds the configured size limit.");
      }
      const media = edit.pending.media;

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
      const destinationPath = resolveDestinationPath({
        documentPath: document.uri.path,
        template: settings.destination,
        workspacePath: workspaceFolder?.uri.path,
      });
      const destinationUri = document.uri.with({
        fragment: "",
        path: destinationPath,
        query: "",
      });

      const now = new Date();
      const date = formatDate(now);
      const time = formatTime(now);
      const documentName = basenameUriPath(document.uri.path);
      let requestedName: string | undefined;
      if (settings.askForName || edit.pending.details) {
        const defaultName = sanitizeStem(buildFilename(
          settings.filename,
          { date, documentName, time },
          media.extension,
          1,
        ).slice(0, -media.extension.length));
        requestedName = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          prompt: "Image file name",
          title: "Paste Image Next",
          validateInput: validateRequestedStem,
          value: defaultName,
        });
        throwIfCancelled(token);
        if (requestedName === undefined) throw new vscode.CancellationError();
      }

      let altText = "";
      if (edit.pending.details && formatSupportsAltText(edit.pending.format)) {
        const requestedAlt = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          prompt: "Image alt text. Leave empty for a decorative image.",
          title: "Paste Image Next",
          value: "",
        });
        throwIfCancelled(token);
        if (requestedAlt === undefined) throw new vscode.CancellationError();
        altText = requestedAlt;
      }

      const assetUri = await allocateAssetUri({
        date,
        destinationUri,
        documentName,
        extension: media.extension,
        filenameTemplate: settings.filename,
        requestedName,
        time,
        token,
      });
      throwIfCancelled(token);
      const referencePath = createReferencePath(
        document.uri.path,
        assetUri.path,
        settings.pathStyle,
        workspaceFolder?.uri.path,
      );
      edit.insertText = formatReference(edit.pending.format, referencePath, altText);
      const additionalEdit = new vscode.WorkspaceEdit();
      additionalEdit.createFile(assetUri, {
        contents: edit.pending.bytes,
        ignoreIfExists: false,
        overwrite: false,
      });
      edit.additionalEdit = additionalEdit;
      return edit;
    } catch (error: unknown) {
      if (error instanceof vscode.CancellationError || token.isCancellationRequested) throw error;
      const message = userMessage(error);
      void vscode.window.showErrorMessage(message);
      throw error;
    }
  }
}

interface AllocateInput {
  readonly date: string;
  readonly destinationUri: vscode.Uri;
  readonly documentName: string;
  readonly extension: ".jpeg" | ".jpg" | ".png";
  readonly filenameTemplate: string;
  readonly requestedName?: string;
  readonly time: string;
  readonly token: vscode.CancellationToken;
}

async function allocateAssetUri(input: AllocateInput): Promise<vscode.Uri> {
  for (let attempt = 1; attempt <= MAX_COLLISION_ATTEMPTS; attempt += 1) {
    throwIfCancelled(input.token);
    const filename = buildFilename(
      input.requestedName ? "${name}" : input.filenameTemplate,
      {
        date: input.date,
        documentName: input.documentName,
        requestedName: input.requestedName,
        time: input.time,
      },
      input.extension,
      attempt,
    );
    const uri = input.destinationUri.with({ path: joinUriPath(input.destinationUri.path, filename) });
    const maximumPath = uri.scheme === "file" ? MAX_FILE_URI_PATH : MAX_OTHER_URI_PATH;
    if (uri.path.length > maximumPath) {
      throw new PasteError("destination", "The image destination path is too long.");
    }
    try {
      await vscode.workspace.fs.stat(uri);
      throwIfCancelled(input.token);
    } catch (error: unknown) {
      throwIfCancelled(input.token);
      if (isFileNotFound(error)) return uri;
      throw new PasteError("destination", "Paste Image Next cannot inspect the destination.");
    }
  }
  throw new PasteError("collision", "Paste Image Next could not allocate a free image file name.");
}

function selectImageCandidate(dataTransfer: vscode.DataTransfer): ImageCandidate | undefined {
  const entries = Array.from(dataTransfer)
    .map(([mime, item], index) => ({ file: item.asFile(), index, mime }))
    .filter((entry): entry is { file: vscode.DataTransferFile; index: number; mime: string } => (
      entry.file !== undefined && isPotentialImage(entry.mime, entry.file.name)
    ))
    .sort((left, right) => (
      candidatePriority(left.mime, left.file) - candidatePriority(right.mime, right.file)
      || left.index - right.index
    ));
  const entry = entries[0];
  if (!entry) return undefined;
  const normalizedMime = entry.mime.split(";", 1)[0]?.trim().toLowerCase();
  return {
    declaredMime: normalizedMime?.startsWith("image/") ? entry.mime : undefined,
    file: entry.file,
  };
}

function readSettings(uri: vscode.Uri): PasteSettings {
  const configuration = vscode.workspace.getConfiguration("pasteImageNext", uri);
  const destination = configuration.get<unknown>("destination", DEFAULT_DESTINATION);
  const filename = configuration.get<unknown>("filename", DEFAULT_FILENAME);
  const askForName = configuration.get<unknown>("askForName", false);
  const markdownEnabled = configuration.get<unknown>("markdown.enabled", false);
  const pathStyle = configuration.get<unknown>("pathStyle", "documentRelative");
  const maximumMiB = configuration.get<unknown>("maximumFileSizeMiB", 50);
  if (typeof destination !== "string" || typeof filename !== "string") {
    throw new PasteError("configuration", "Paste Image Next has an invalid text setting.");
  }
  if (typeof askForName !== "boolean" || typeof markdownEnabled !== "boolean") {
    throw new PasteError("configuration", "Paste Image Next has an invalid Boolean setting.");
  }
  if (pathStyle !== "documentRelative" && pathStyle !== "workspaceRelative") {
    throw new PasteError("configuration", "Paste Image Next has an invalid path style.");
  }
  if (!Number.isInteger(maximumMiB) || (maximumMiB as number) < 1 || (maximumMiB as number) > 100) {
    throw new PasteError("configuration", "Paste Image Next has an invalid file-size limit.");
  }
  return {
    askForName,
    destination,
    filename,
    markdownEnabled,
    maximumBytes: (maximumMiB as number) * MEBIBYTE,
    pathStyle,
  };
}

function assertWritableDocument(document: vscode.TextDocument): void {
  if (document.uri.scheme === "untitled") {
    throw new PasteError("destination", "Save the document before you paste an image asset.");
  }
  if (vscode.workspace.fs.isWritableFileSystem(document.uri.scheme) === false) {
    throw new PasteError("destination", "Save the document in a writable workspace before you paste an image asset.");
  }
}

function kindFor(format: ReferenceFormat, details: boolean): vscode.DocumentDropOrPasteEditKind {
  if (format === "path") return details ? PATH_DETAILS_KIND : PATH_KIND;
  return details ? DETAILS_KIND : BASE_KIND;
}

function candidatePriority(mime: string, file: vscode.DataTransferFile): number {
  const normalized = mime.split(";", 1)[0]?.trim().toLowerCase();
  if (file.uri) return 0;
  if (!normalized?.startsWith("image/")) return 1;
  if (normalized === "image/png") return 2;
  if (normalized === "image/jpeg" || normalized === "image/jpg") return 3;
  return 4;
}

function formatDate(value: Date): string {
  return [value.getFullYear(), value.getMonth() + 1, value.getDate()]
    .map((part, index) => index === 0 ? String(part) : String(part).padStart(2, "0"))
    .join("-");
}

function formatTime(value: Date): string {
  return [value.getHours(), value.getMinutes(), value.getSeconds()]
    .map((part) => String(part).padStart(2, "0"))
    .join("");
}

function isFileNotFound(error: unknown): boolean {
  return error instanceof vscode.FileSystemError && error.code === "FileNotFound";
}

function throwIfCancelled(token: vscode.CancellationToken): void {
  if (token.isCancellationRequested) throw new vscode.CancellationError();
}

class PasteError extends Error {
  constructor(
    readonly code: "collision" | "configuration" | "destination" | "stale",
    message: string,
  ) {
    super(message);
    this.name = "PasteError";
  }
}

function userMessage(error: unknown): string {
  if (error instanceof MediaError) {
    if (error.code === "too-large") {
      return "The image exceeds the configured size limit. Reduce it or change Paste Image Next: Maximum File Size.";
    }
    return "Paste Image Next accepts PNG and JPEG files whose MIME type, extension, and bytes agree.";
  }
  if (error instanceof FilenameError || error instanceof PathError) {
    return "Fix the Paste Image Next filename or destination setting, then paste again.";
  }
  if (error instanceof PasteError) return error.message;
  return "Paste Image Next could not create the asset. Make sure the destination is writable, then paste again.";
}
