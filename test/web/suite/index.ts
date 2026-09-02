import * as vscode from "vscode";
import { PasteImageProvider } from "../../../src/pasteProvider.ts";

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const neverCancelled = new vscode.CancellationTokenSource();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

class FileItem extends vscode.DataTransferItem {
  override asFile(): vscode.DataTransferFile {
    return { data: async () => png, name: "web-capture.png" };
  }
}

export async function run(): Promise<void> {
  const extension = vscode.extensions.getExtension("gvastethecreator.paste-image-next");
  assert(extension, "Paste Image Next was not discovered in the web host.");
  await extension.activate();
  assert(extension.isActive, "Paste Image Next did not activate in the web host.");

  const folder = vscode.workspace.workspaceFolders?.[0];
  assert(folder, "The virtual test workspace did not open.");
  assert(folder.uri.scheme === "vscode-test-web", "The web test is not using a virtual filesystem.");
  const document = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(folder.uri, "index.html"));
  await vscode.window.showTextDocument(document, { preview: false });

  const transfer = new vscode.DataTransfer();
  transfer.set("image/png", new FileItem(""));
  const range = new vscode.Range(1, 0, 1, 0);
  const provider = new PasteImageProvider();
  const edits = await provider.provideDocumentPasteEdits(
    document,
    [range],
    transfer,
    { only: undefined, triggerKind: vscode.DocumentPasteTriggerKind.Automatic },
    neverCancelled.token,
  );
  assert(edits?.length === 1, "The web provider did not return one HTML edit.");
  const resolved = await provider.resolveDocumentPasteEdit(edits[0], neverCancelled.token);
  assert(typeof resolved.insertText === "string", "The web edit has no string insertion.");
  assert(resolved.additionalEdit, "The web edit has no resource edit.");
  resolved.additionalEdit.replace(document.uri, range, resolved.insertText);
  assert(await vscode.workspace.applyEdit(resolved.additionalEdit), "The virtual workspace edit failed.");

  const match = /src="([^"]+)"/.exec(resolved.insertText);
  assert(match, "The web reference has no src attribute.");
  const assetUri = vscode.Uri.joinPath(vscode.Uri.joinPath(document.uri, ".."), match[1]);
  const written = await vscode.workspace.fs.readFile(assetUri);
  assert(written.length === png.length, "The web asset length changed.");
  assert(written.every((value, index) => value === png[index]), "The web asset bytes changed.");
}
