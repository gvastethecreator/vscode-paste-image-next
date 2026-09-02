import * as vscode from "vscode";
import {
  PASTE_EDIT_KINDS,
  PasteImageProvider,
} from "./pasteProvider.ts";

export { PASTE_EDIT_KINDS, PasteImageProvider } from "./pasteProvider.ts";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerDocumentPasteEditProvider(
      { scheme: "*" },
      new PasteImageProvider(),
      {
        providedPasteEditKinds: PASTE_EDIT_KINDS,
        pasteMimeTypes: ["image/png", "image/jpeg", "image/jpg", "files"],
      },
    ),
  );
}

export function deactivate(): void {}
