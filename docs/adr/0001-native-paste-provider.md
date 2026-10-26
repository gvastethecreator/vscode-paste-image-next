# ADR 0001: Use the native document paste provider

- Status: Accepted
- Date: 2026-09-02
- Decision owner: Paste Image Next

## Context

The scaffold exposed two commands, but stable VS Code APIs do not let an extension command request the current binary clipboard payload or delegate safely to the editor's native paste pipeline. Platform clipboard helpers would add shell, binary, packaging, privacy, and remote-host risk.

Current stable VS Code provides the binary image inside a user-initiated DocumentPasteEditProvider request. DataTransferFile.data() returns the source bytes, and WorkspaceEdit.createFile accepts those bytes as part of the selected paste edit.

VS Code already owns normal Markdown image paste, so competing by default would make behavior less predictable.

## Decision

Use an API-only DocumentPasteEditProvider for PNG and JPEG inputs.

- Return automatic edits only for HTML, CSS, SCSS, Less, and MDX.
- Return Markdown and generic path edits only through Paste As, except for the explicit Markdown opt-in.
- Yield the opt-in Markdown edit to VS Code's markdown.link.image kind.
- Read and validate bytes inside the provider request because VS Code invalidates DataTransfer after that method returns.
- Keep destination allocation and every filesystem mutation inside the selected edit's resolution/application path.
- Create the asset with WorkspaceEdit.createFile and insert the reference in the same transaction.
- Use workspace.fs and Uri operations for desktop, remote, web, and virtual filesystems.
- Ship Node and browser bundles with ui then workspace host preference.
- Remove the scaffold commands instead of publishing commands that cannot complete their promise.
- Add no native helper, temporary file, runtime dependency, webview, network request, or telemetry.

## Consequences

The normal editor Paste and Paste As commands are the complete user interface. Paste Image Next cannot act when VS Code does not expose a supported image DataTransfer item. Eligible bytes live briefly in the offered edits because their source object cannot outlive the provider call; they are never logged, cached globally, or transmitted.

The transaction follows native resource-edit undo semantics: undo removes both reference and asset; redo restores both, including asset bytes changed after creation. Documentation must state this clearly.

Writable virtual filesystems work through the same code path. Read-only filesystems and untitled documents fail before bytes are written. Remote and Codespaces support remains a release claim only after a packaged manual smoke test.

## Rejected alternatives

- Platform clipboard commands: rejected because they require OS-specific binaries or shell execution.
- Background clipboard polling: rejected for privacy, lifecycle, and performance reasons.
- A custom paste command: rejected because stable APIs cannot provide the binary payload to that command.
- A settings webview: rejected because six native settings fully represent the product contract.
- Direct filesystem writes during provider discovery: rejected because unselected edits must have no side effects.

## Evidence

- Desktop Extension Host integration covers binary creation, insertion, collisions, cancellation, read-only/untitled rejection, and undo/redo.
- Browser Extension Host integration covers a writable non-file filesystem.
- The declared minimum VS Code version and current stable are test targets.
- The package inspector rejects runtime network surfaces, source/test leakage, missing alpha, and unexpected artifacts.

Official API references:

- https://code.visualstudio.com/api/references/vscode-api#DocumentPasteEditProvider
- https://code.visualstudio.com/api/references/vscode-api#DataTransferFile
- https://code.visualstudio.com/api/references/vscode-api#WorkspaceEdit
- https://code.visualstudio.com/api/advanced-topics/extension-host
