const assert = require("node:assert/strict");
const path = require("node:path");
const vscode = require("vscode");

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const neverCancelled = new vscode.CancellationTokenSource();

class FileItem extends vscode.DataTransferItem {
  constructor(file) {
    super("");
    this.file = file;
  }

  asFile() {
    return this.file;
  }
}

function dataTransfer(fileName = "clipboard.png", bytes = png, mimeOverride) {
  const transfer = new vscode.DataTransfer();
  const mime = mimeOverride || (/\.jpe?g$/i.test(fileName) ? "image/jpeg" : "image/png");
  transfer.set(mime, new FileItem({
    data: async () => bytes,
    name: fileName,
  }));
  return transfer;
}

function context(triggerKind, only) {
  return { only, triggerKind };
}

async function openFixture(name) {
  const folder = vscode.workspace.workspaceFolders?.[0];
  assert.ok(folder, "The test workspace did not open.");
  const document = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(folder.uri, name));
  await vscode.window.showTextDocument(document, { preview: false });
  return document;
}

function pathFromReference(reference) {
  const match = /src="([^"]+)"/.exec(reference);
  assert.ok(match, "The HTML reference has no src attribute.");
  return match[1];
}

async function exists(uri) {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch (error) {
    if (error instanceof vscode.FileSystemError && error.code === "FileNotFound") return false;
    throw error;
  }
}

async function applyResolvedPaste(document, range, edit) {
  assert.equal(typeof edit.insertText, "string");
  assert.ok(edit.additionalEdit, "The paste edit has no binary resource edit.");
  edit.additionalEdit.replace(document.uri, range, edit.insertText);
  assert.equal(await vscode.workspace.applyEdit(edit.additionalEdit), true);
}

async function run() {
  const extension = vscode.extensions.getExtension("gvastethecreator.paste-image-next");
  assert.ok(extension, "Paste Image Next was not discovered.");
  await extension.activate();
  assert.equal(extension.isActive, true);
  assert.equal(extension.packageJSON.contributes.commands, undefined);

  const modulePath = path.join(extension.extensionPath, "dist", "node", "extension.cjs");
  const { PasteImageProvider, PASTE_EDIT_KINDS } = require(modulePath);
  assert.equal(PASTE_EDIT_KINDS.length, 4);
  const provider = new PasteImageProvider();
  const html = await openFixture("index.html");
  const insertAt = new vscode.Range(1, 0, 1, 0);

  const unsupported = new vscode.DataTransfer();
  unsupported.set("text/plain", new vscode.DataTransferItem("not an image"));
  assert.equal(await provider.provideDocumentPasteEdits(
    html,
    [insertAt],
    unsupported,
    context(vscode.DocumentPasteTriggerKind.Automatic),
    neverCancelled.token,
  ), undefined, "Unsupported clipboard content must not produce an edit.");

  const genericFileEdits = await provider.provideDocumentPasteEdits(
    html,
    [insertAt],
    dataTransfer("clipboard.png", png, "application/octet-stream"),
    context(vscode.DocumentPasteTriggerKind.Automatic),
    neverCancelled.token,
  );
  assert.equal(genericFileEdits.length, 1, "A supported file entry must be eligible without trusting its MIME.");

  const preferredFileTransfer = new vscode.DataTransfer();
  preferredFileTransfer.set("image/png", new FileItem({
    data: async () => Uint8Array.of(1, 2, 3, 4),
    name: "rendered.png",
  }));
  preferredFileTransfer.set("files", new FileItem({
    data: async () => png,
    name: "original.png",
    uri: vscode.Uri.file("C:/clipboard/original.png"),
  }));
  const preferredFileEdits = await provider.provideDocumentPasteEdits(
    html,
    [insertAt],
    preferredFileTransfer,
    context(vscode.DocumentPasteTriggerKind.Automatic),
    neverCancelled.token,
  );
  assert.equal(preferredFileEdits.length, 1, "A copied image file must win over a rendered clipboard representation.");

  const filtered = await provider.provideDocumentPasteEdits(
    html,
    [insertAt],
    dataTransfer(),
    context(vscode.DocumentPasteTriggerKind.PasteAs, PASTE_EDIT_KINDS[1]),
    neverCancelled.token,
  );
  assert.equal(filtered.length, 1, "A requested detailed kind must not return its parent edit.");
  assert.equal(filtered[0].kind.value, PASTE_EDIT_KINDS[1].value);
  const edits = await provider.provideDocumentPasteEdits(
    html,
    [insertAt],
    dataTransfer(),
    context(vscode.DocumentPasteTriggerKind.Automatic),
    neverCancelled.token,
  );
  assert.equal(edits.length, 1);
  const assetsDirectory = vscode.Uri.joinPath(html.uri, "..", "assets");
  assert.equal(await exists(assetsDirectory), false, "Offering an edit must not create a directory or file.");
  const resolved = await provider.resolveDocumentPasteEdit(edits[0], neverCancelled.token);
  assert.equal(await exists(assetsDirectory), false, "Resolving an edit must not mutate the filesystem.");
  assert.match(resolved.insertText, /^<img src="\.\/assets\/image-\d{4}-\d{2}-\d{2}-\d{6}\.png" alt="">$/);
  await applyResolvedPaste(html, insertAt, resolved);

  const reference = pathFromReference(resolved.insertText);
  const assetUri = vscode.Uri.joinPath(vscode.Uri.joinPath(html.uri, ".."), reference);
  assert.deepEqual([...await vscode.workspace.fs.readFile(assetUri)], [...png]);
  assert.match(html.getText(), /<img src=/);

  await vscode.commands.executeCommand("undo");
  assert.equal(await exists(assetUri), false, "Undo must remove the asset created by the same edit.");
  assert.doesNotMatch(html.getText(), /<img src=/);
  await vscode.commands.executeCommand("redo");
  assert.equal(await exists(assetUri), true, "Redo must restore the asset.");
  assert.match(html.getText(), /<img src=/);

  const modified = Uint8Array.from([...png, 0xde, 0xad, 0xbe, 0xef]);
  await vscode.workspace.fs.writeFile(assetUri, modified);
  await vscode.commands.executeCommand("undo");
  assert.equal(await exists(assetUri), false, "Undo must remove a subsequently modified asset as part of the paste transaction.");
  assert.doesNotMatch(html.getText(), /<img src=/);
  await vscode.commands.executeCommand("redo");
  assert.equal(await exists(assetUri), true, "Redo must restore the modified asset.");
  assert.deepEqual([...await vscode.workspace.fs.readFile(assetUri)], [...modified]);
  assert.match(html.getText(), /<img src=/);

  const htmlConfiguration = vscode.workspace.getConfiguration("pasteImageNext", html.uri);
  await htmlConfiguration.update("filename", "collision", vscode.ConfigurationTarget.Workspace);
  await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(assetsDirectory, "collision.png"), png);
  const collisionEdits = await provider.provideDocumentPasteEdits(
    html,
    [insertAt],
    dataTransfer(),
    context(vscode.DocumentPasteTriggerKind.Automatic),
    neverCancelled.token,
  );
  const collision = await provider.resolveDocumentPasteEdit(collisionEdits[0], neverCancelled.token);
  assert.match(collision.insertText, /-2\.png/);
  const collisionReference = pathFromReference(collision.insertText);
  const collisionUri = vscode.Uri.joinPath(vscode.Uri.joinPath(html.uri, ".."), collisionReference);
  const competingBytes = Uint8Array.from([...png, 1, 2, 3]);
  await vscode.workspace.fs.writeFile(collisionUri, competingBytes);
  const documentBeforeRace = html.getText();
  collision.additionalEdit.replace(html.uri, insertAt, collision.insertText);
  assert.equal(await vscode.workspace.applyEdit(collision.additionalEdit), false, "A late filename race must fail the whole edit.");
  assert.equal(html.getText(), documentBeforeRace, "A failed resource edit must not insert a reference.");
  assert.deepEqual([...await vscode.workspace.fs.readFile(collisionUri)], [...competingBytes], "A competing file must not be overwritten.");
  await htmlConfiguration.update("filename", undefined, vscode.ConfigurationTarget.Workspace);

  const markdown = await openFixture("notes.md");
  const automaticMarkdown = await provider.provideDocumentPasteEdits(
    markdown,
    [new vscode.Range(2, 0, 2, 0)],
    dataTransfer(),
    context(vscode.DocumentPasteTriggerKind.Automatic),
    neverCancelled.token,
  );
  assert.equal(automaticMarkdown, undefined, "Normal Markdown paste must remain native by default.");
  const explicitMarkdown = await provider.provideDocumentPasteEdits(
    markdown,
    [new vscode.Range(2, 0, 2, 0)],
    dataTransfer(),
    context(vscode.DocumentPasteTriggerKind.PasteAs),
    neverCancelled.token,
  );
  assert.equal(explicitMarkdown.length, 2, "Paste As must offer default and detailed Markdown edits.");
  const markdownConfiguration = vscode.workspace.getConfiguration("pasteImageNext", markdown.uri);
  await markdownConfiguration.update("markdown.enabled", true, vscode.ConfigurationTarget.Workspace);
  const optedInMarkdown = await provider.provideDocumentPasteEdits(
    markdown,
    [new vscode.Range(2, 0, 2, 0)],
    dataTransfer(),
    context(vscode.DocumentPasteTriggerKind.Automatic),
    neverCancelled.token,
  );
  assert.equal(optedInMarkdown.length, 1);
  assert.equal(optedInMarkdown[0].yieldTo?.[0]?.value, "markdown.link.image", "VS Code's Markdown image provider must keep priority.");
  await markdownConfiguration.update("markdown.enabled", false, vscode.ConfigurationTarget.Workspace);

  const css = await openFixture("styles.css");
  const cssEdits = await provider.provideDocumentPasteEdits(
    css,
    [new vscode.Range(1, 2, 1, 2)],
    dataTransfer("photo.jpg", Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])),
    context(vscode.DocumentPasteTriggerKind.Automatic),
    neverCancelled.token,
  );
  assert.equal(cssEdits.length, 1);
  const cssResolved = await provider.resolveDocumentPasteEdit(cssEdits[0], neverCancelled.token);
  assert.match(cssResolved.insertText, /^url\("\.\/assets\/image-.*\.jpg"\)$/);

  const cancellation = new vscode.CancellationTokenSource();
  cancellation.cancel();
  assert.equal(await provider.provideDocumentPasteEdits(
    html,
    [insertAt],
    dataTransfer(),
    context(vscode.DocumentPasteTriggerKind.Automatic),
    cancellation.token,
  ), undefined);

  const duringRead = new vscode.CancellationTokenSource();
  const cancellingTransfer = new vscode.DataTransfer();
  cancellingTransfer.set("image/png", new FileItem({
    data: async () => {
      duringRead.cancel();
      return png;
    },
    name: "cancelled.png",
  }));
  const cancellingEdits = await provider.provideDocumentPasteEdits(
    html,
    [insertAt],
    cancellingTransfer,
    context(vscode.DocumentPasteTriggerKind.Automatic),
    duringRead.token,
  );
  assert.equal(cancellingEdits, undefined, "Cancellation after the byte read must stop before an edit is offered.");

  const untitled = await vscode.workspace.openTextDocument({ content: "<main></main>", language: "html" });
  const untitledRange = new vscode.Range(0, 0, 0, 0);
  let untitledBytesRead = false;
  const untitledTransfer = new vscode.DataTransfer();
  untitledTransfer.set("image/png", new FileItem({
    data: async () => {
      untitledBytesRead = true;
      return png;
    },
    name: "untitled.png",
  }));
  const untitledEdits = await provider.provideDocumentPasteEdits(
    untitled,
    [untitledRange],
    untitledTransfer,
    context(vscode.DocumentPasteTriggerKind.Automatic),
    neverCancelled.token,
  );
  assert.equal(untitledEdits, undefined, "Untitled documents must be rejected before an edit is offered.");
  assert.equal(untitledBytesRead, false, "Untitled documents must be rejected before clipboard bytes are read.");

  const readonlyScheme = `pin-readonly-${Date.now()}`;
  const readonlyProvider = {
    createDirectory() { throw vscode.FileSystemError.NoPermissions(); },
    delete() { throw vscode.FileSystemError.NoPermissions(); },
    onDidChangeFile: new vscode.EventEmitter().event,
    readDirectory(uri) {
      return uri.path === "/" ? [["page.html", vscode.FileType.File]] : [];
    },
    readFile() { return new TextEncoder().encode("<main></main>"); },
    rename() { throw vscode.FileSystemError.NoPermissions(); },
    stat(uri) {
      return {
        ctime: 0,
        mtime: 0,
        size: uri.path === "/" ? 0 : 13,
        type: uri.path === "/" ? vscode.FileType.Directory : vscode.FileType.File,
      };
    },
    watch() { return new vscode.Disposable(() => {}); },
    writeFile() { throw vscode.FileSystemError.NoPermissions(); },
  };
  const readonlyRegistration = vscode.workspace.registerFileSystemProvider(
    readonlyScheme,
    readonlyProvider,
    { isCaseSensitive: true, isReadonly: true },
  );
  try {
    const readonlyDocument = await vscode.workspace.openTextDocument(vscode.Uri.parse(`${readonlyScheme}:/page.html`));
    let readonlyBytesRead = false;
    const readonlyTransfer = new vscode.DataTransfer();
    readonlyTransfer.set("image/png", new FileItem({
      data: async () => {
        readonlyBytesRead = true;
        return png;
      },
      name: "readonly.png",
    }));
    const readonlyEdits = await provider.provideDocumentPasteEdits(
      readonlyDocument,
      [new vscode.Range(0, 0, 0, 0)],
      readonlyTransfer,
      context(vscode.DocumentPasteTriggerKind.Automatic),
      neverCancelled.token,
    );
    assert.equal(readonlyEdits, undefined, "Read-only documents must be rejected before an edit is offered.");
    assert.equal(readonlyBytesRead, false, "Read-only documents must be rejected before clipboard bytes are read.");
  } finally {
    readonlyRegistration.dispose();
  }
}

module.exports = { run };
