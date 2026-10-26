import { changeSettings } from "./settingsActions.ts";
import * as vscode from "vscode";
import {
  PASTE_EDIT_KINDS,
  PasteImageProvider,
} from "./pasteProvider.ts";

export { PASTE_EDIT_KINDS, PasteImageProvider } from "./pasteProvider.ts";

const SETTING_KEYS = [
  "destination",
  "filename",
  "askForName",
  "pathStyle",
  "markdown.enabled",
  "maximumFileSizeMiB",
] as const;

export async function setDefaultSettings(): Promise<void> {
  await changeSettings("pasteImageNext", "Paste Image Next", SETTING_KEYS, "defaults", true);
}

export async function resetSettings(): Promise<void> {
  await changeSettings("pasteImageNext", "Paste Image Next", SETTING_KEYS, "inherit", true);
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("pasteImageNext.setDefaults", () => setDefaultSettings()),
    vscode.commands.registerCommand("pasteImageNext.resetSettings", () => resetSettings()),
    vscode.languages.registerDocumentPasteEditProvider(
      { scheme: "*" },
      new PasteImageProvider(),
      {
        providedPasteEditKinds: PASTE_EDIT_KINDS,
        pasteMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "files"],
      },
    ),
  );
}

export function deactivate(): void {}
