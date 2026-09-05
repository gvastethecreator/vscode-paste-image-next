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

async function setDefaultSettings(): Promise<void> {
  const confirm = "Set defaults";
  const choice = await vscode.window.showWarningMessage(
    "Set Paste Image Next defaults for all workspaces?",
    { modal: true },
    confirm,
  );
  if (choice !== confirm) {
    return;
  }
  const configuration = vscode.workspace.getConfiguration("pasteImageNext");
  const targets: vscode.ConfigurationTarget[] = [vscode.ConfigurationTarget.Global];
  if (vscode.workspace.workspaceFile || vscode.workspace.workspaceFolders?.length) {
    targets.push(vscode.ConfigurationTarget.Workspace);
  }
  for (const key of SETTING_KEYS) {
    const value = configuration.inspect(key)?.defaultValue;
    for (const target of targets) {
      await configuration.update(key, value, target);
    }
  }
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("pasteImageNext.setDefaults", () => setDefaultSettings()),
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
