# Paste Image Next — Complete delivery plan

Status: execution specification and feasibility plan  
Repository: `gvastethecreator/vscode-paste-image-next`  
Product phase: scaffold  
First public target: `0.1.0`, only after the paste-data spike passes  
Last reviewed: 2026-09-01

This document supersedes outdated implementation assumptions in `docs/PDR.md` while preserving its product intent. Current stable VS Code exposes `DocumentPasteEditProvider`, `DataTransfer`, `DataTransferFile.data()`, and `WorkspaceEdit.createFile(..., { contents })`. These APIs may allow a cross-platform, web-compatible implementation without shell commands or bundled native helpers. That path must be proven first.

---

## 1. Current state

The repository includes a consistent scaffold:

- strict TypeScript, esbuild, pnpm, and CI;
- two contributed commands;
- PDR, security/development/publishing notes, agent guidance, icon, and preview;
- aspirational Virtual Workspace and Restricted Mode support.

The product is not implemented:

- both commands invoke a shared not-implemented handler;
- the only unit test checks the Node test runner;
- no paste provider, DataTransfer inspection, binary file creation, destination resolver, naming policy, collision handling, reference formatter, or edit transaction exists;
- no platform test evidence exists;
- no browser entry, Extension Host test, or packaged VSIX smoke test exists;
- `package.json` declares ESM while esbuild emits CommonJS to a `.js` file;
- the current command-first PDR assumes binary clipboard access must come from a native/platform helper, but the current paste-edit APIs need to be evaluated before adopting that complexity.

---

## 2. Updated product position

### Primary interaction

The primary `0.1` experience should be a native VS Code paste edit:

```text
copy image in OS
→ paste or Paste As in a supported editor
→ Paste Image Next receives image/file DataTransfer data
→ destination and collision-safe name are resolved
→ one paste edit creates the binary asset and inserts a reference
```

This integrates with VS Code's paste widget and competing providers instead of trying to poll the clipboard.

### Commands

The existing commands must be reconsidered:

- `Paste Image Next: Paste Image` can only remain if it can trigger the normal paste pipeline through a stable documented command/API; it cannot read image bytes through `vscode.env.clipboard`, which exposes text only.
- `Paste Image Next: Paste Image As...` should delegate to the native Paste As experience where a stable documented path exists.
- If a reliable command flow cannot be implemented without undocumented built-in commands, remove or rename these commands before publication and make normal Paste/Paste As the public contract.

Do not publish dead commands merely because they exist in the scaffold.

### Markdown overlap

VS Code already supports pasting images into Markdown and configures destination through `markdown.copyFiles.destination`.

Default policy:

- do not replace or intercept standard Markdown paste by default;
- either exclude Markdown from the provider selector or yield to VS Code's built-in Markdown provider;
- support Markdown only through an explicit Paste As kind or opt-in setting when Paste Image Next adds clear value;
- prioritize HTML, CSS-family files, MDX, and path-only fallback.

---

## 3. Blocking feasibility spike

No implementation roadmap may assume image MIME behavior. Build a minimal spike extension and record real DataTransfer observations without committing sensitive image bytes.

### 3.1 Environments

Test:

| Environment | Required evidence |
| --- | --- |
| Windows 11 desktop | Screenshot copied through Snipping Tool and image copied from browser/file manager. |
| macOS desktop | Screenshot and copied image. |
| Linux X11 | Screenshot and copied image where available. |
| Linux Wayland | Screenshot and copied image where available. |
| WSL workspace | Local clipboard with remote/WSL workspace destination. |
| Remote SSH | Local clipboard with remote filesystem destination. |
| GitHub Codespaces | Browser/local clipboard with remote workspace. |
| `vscode.dev` | Browser clipboard, virtual workspace, and browser security limitations. |
| `github.dev` | Repository virtual workspace if writable workflow is meaningful. |

### 3.2 Data to record

For each test, record only metadata:

- paste trigger kind;
- available MIME keys;
- whether `DataTransferItem.asFile()` exists;
- file name, URI presence, and byte length;
- whether `DataTransferFile.data()` succeeds;
- raw image MIME item behavior when no file exists;
- whether `WorkspaceEdit.createFile` accepts `DataTransferFile` directly;
- whether `Uint8Array` creation works;
- whether destination URI schemes are writable;
- whether one `DocumentPasteEdit` can create the file and insert text;
- undo/redo result;
- cancellation result;
- competing built-in provider ordering.

Never log image contents or base64.

### 3.3 Spike exit criteria

The API-first architecture is approved if:

- at least Windows and macOS clipboard screenshots produce accessible bytes;
- asset creation and reference insertion work in one paste operation;
- no shell/native executable is required;
- remote workspace write works through a URI-based edit or has a clearly documented limitation;
- behavior when Markdown's built-in provider is present can be controlled with selector/kind/yield ordering;
- cancellation does not leave partial files;
- filename collisions can be resolved before edit application.

Linux and web support may be included only where proven. Unsupported environments must be declared truthfully.

### 3.4 Native helper fallback policy

Do not add PowerShell, AppleScript, `xclip`, `wl-paste`, native Node addons, daemons, packaged binaries, or shell execution to `0.1` unless the API-first spike fails and a separate architecture/security review explicitly approves a narrower desktop product.

A platform helper would require:

- per-OS/architecture packaging;
- signing/notarization considerations;
- Restricted Mode review;
- shell-injection protections;
- temp-file cleanup;
- licensing and update policy;
- substantially larger maintenance scope.

The preferred answer to an unsupported platform is a documented limitation, not an unsafe fallback.

---

## 4. `0.1.0` release contract

Ship only environments and MIME sources proven by the spike.

### Required target languages

- HTML;
- CSS;
- SCSS;
- Less;
- MDX, after exact syntax decision;
- plaintext/path-only fallback through explicit Paste As, not automatic guessing.

Markdown is excluded/yielded by default.

### Required input types

- one image from OS clipboard represented as `DataTransferFile` or proven image MIME bytes;
- PNG and JPEG at minimum where source provides them;
- preserve source bytes and media type;
- no image transcoding in `0.1`;
- no SVG-from-clipboard claim unless proven and security-reviewed;
- multi-image paste is post-MVP unless the provider receives multiple files and implementation remains straightforward.

### Required output

1. deterministic destination URI;
2. sanitized collision-safe filename;
3. binary file resource edit with no overwrite;
4. language-appropriate text insertion;
5. one visible paste option with a clear title;
6. cancellation-safe behavior;
7. explicit error when no supported writable destination exists.

---

## 5. Paste provider contract

Register `languages.registerDocumentPasteEditProvider` with:

- a narrow document selector;
- `pasteMimeTypes` containing proven `image/*` and/or `files` patterns;
- a unique `DocumentDropOrPasteEditKind` hierarchy;
- `providedPasteEditKinds` matching actual returned edits;
- explicit `yieldTo` behavior where VS Code's built-in provider should win.

Provider rules:

- inspect DataTransfer synchronously enough to identify eligibility;
- defer expensive byte reads or destination preparation to `resolveDocumentPasteEdit` where appropriate;
- honor cancellation tokens before and after every async boundary;
- return no edit for unsupported MIME/source rather than throwing;
- never mutate the filesystem directly during `provideDocumentPasteEdits` if the edit has not been selected;
- create the file only through the selected edit/resolve path;
- avoid duplicate options for equivalent MIME entries;
- never choose an extension solely from untrusted clipboard filename text; reconcile MIME, filename, and signature policy.

### Workspace edit

Preferred transaction:

```ts
const edit = new vscode.WorkspaceEdit();
edit.createFile(assetUri, {
  contents: dataTransferFileOrBytes,
  overwrite: false,
  ignoreIfExists: false,
});

const pasteEdit = new vscode.DocumentPasteEdit(
  referenceText,
  "Paste image as project asset",
  kind,
);
pasteEdit.additionalEdit = edit;
```

Exact API shape must follow the current `@types/vscode` version and minimum-version decision.

Undo/redo semantics must be measured. Document whether undo removes both inserted reference and created file. If VS Code protects a subsequently modified asset during undo, capture that behavior in integration tests. Do not invent a separate destructive cleanup command until this is understood.

---

## 6. Destination resolution

### Proposed settings

```json
{
  "pasteImageNext.destination": "${documentDir}/assets",
  "pasteImageNext.filename": "image-${date}-${time}",
  "pasteImageNext.askForName": false,
  "pasteImageNext.pathStyle": "relative",
  "pasteImageNext.markdown.enabled": false
}
```

Supported tokens should be deliberately small:

- `${workspaceFolder}`;
- `${documentDir}`;
- `${documentName}`;
- `${date}`;
- `${time}`;
- `${counter}`.

Rules:

- no environment-variable expansion;
- no shell expansion;
- no absolute destination from workspace settings unless explicitly allowed and security-reviewed;
- resolve tokens as URI operations, not OS string concatenation;
- document outside a workspace uses document directory if writable, otherwise prompts for destination or rejects;
- untitled documents require a chosen workspace folder/destination;
- multi-root selection uses the folder containing the active document, or prompts if ambiguous;
- parent directories are created only through explicit resource edits/approved API path;
- read-only/virtual schemes fail cleanly;
- destination must remain visible in Paste As title/detail or confirmation when ambiguous.

### Path generation

Inserted references use `/` separators independent of Windows filesystem separators.

Test:

- different drives;
- spaces and Unicode;
- nested folders;
- files outside workspace;
- remote and virtual URIs;
- root-relative versus document-relative paths;
- URL encoding rules;
- CSS quoting;
- MDX JSX syntax;
- case sensitivity.

---

## 7. Filename and media validation

### Filename requirements

- sanitize `/`, `\\`, control characters, reserved punctuation, and trailing dots/spaces;
- handle Windows reserved basenames;
- preserve a safe source stem only when configured;
- cap basename and total path length conservatively;
- normalize empty result to `image`;
- append an extension derived from trusted/proven media information;
- use deterministic counter suffixes;
- never overwrite by default;
- resolve collisions immediately before edit creation;
- handle races where another file appears before edit application by failing safely, not overwriting.

Suggested collision sequence:

```text
image.png
image-2.png
image-3.png
```

### MIME/signature policy

`0.1` should support a small allowlist:

- `image/png` → `.png`;
- `image/jpeg` → `.jpg` or preserve safe `.jpeg`;
- optionally `image/gif`/`image/webp` only after actual clipboard tests.

Validate magic bytes for common formats where practical. When MIME, extension, and signature conflict:

- prefer safe rejection or normalized known extension;
- never execute or render data;
- do not accept arbitrary file types merely because clipboard metadata says `image/*`;
- impose maximum asset size before materializing full bytes when API metadata permits, or immediately after read otherwise.

Default hard maximum proposal: 50 MiB, configurable only within bounded limits.

SVG needs a separate security decision because it is active text content in some rendering contexts.

---

## 8. Reference formatters

Use a pure formatter interface:

```ts
interface ReferenceFormatter {
  supports(languageId: string): boolean;
  format(input: {
    relativePath: string;
    altText: string;
    quote: "single" | "double";
  }): string;
}
```

### HTML

Default:

```html
<img src="./assets/image.png" alt="">
```

Decide self-closing syntax only by setting or language mode; do not assume XHTML.

### CSS/SCSS/Less

Default:

```css
url("./assets/image.png")
```

Do not include `background-image:` automatically.

### MDX

Choose one documented default:

- Markdown image syntax; or
- JSX `<img />`.

Use a setting only if both modes have clear demand. Avoid generating imports in `0.1`.

### Unknown language

Return no automatic provider edit. An explicit Paste As option may insert a relative path only when the user selects it.

### Alt text

- default empty alt for HTML/MDX image insertion;
- optional Input Box only for explicit Paste As/“ask” mode;
- no external AI or OCR;
- sanitize inserted quote characters through formatter logic;
- never infer alt text from sensitive filename without explicit policy.

---

## 9. Architecture

Recommended structure:

```text
src/
├─ extension.ts
├─ paste/
│  ├─ provider.ts
│  ├─ kinds.ts
│  ├─ dataTransfer.ts
│  └─ resolveEdit.ts
├─ core/
│  ├─ media.ts
│  ├─ filename.ts
│  ├─ templates.ts
│  ├─ collisions.ts
│  ├─ limits.ts
│  └─ result.ts
├─ destination/
│  ├─ context.ts
│  ├─ resolve.ts
│  ├─ relativePath.ts
│  └─ directories.ts
├─ formatters/
│  ├─ formatter.ts
│  ├─ html.ts
│  ├─ css.ts
│  ├─ mdx.ts
│  └─ pathOnly.ts
├─ commands/
│  └─ pasteAs.ts
└─ platform/
   ├─ configuration.ts
   ├─ workspaceEdit.ts
   ├─ logging.ts
   └─ feedback.ts
```

Pure modules must not import `vscode`:

- filename sanitization;
- token/template expansion using normalized context;
- media allowlist/signature checks;
- collision candidate names;
- relative reference formatting;
- language formatter output;
- numeric limits.

No runtime native dependency unless the API-first architecture is formally rejected.

---

## 10. Manifest and runtime requirements

### Build

Correct the current ESM/CommonJS mismatch.

Recommended target after spike:

- Node: `dist/node/extension.cjs`;
- browser: `dist/web/extension.js` if DataTransfer/file edits work in web;
- one browser-safe common core;
- no Node-only path/fs assumptions;
- no platform binaries in initial package.

### Activation

The paste provider should activate contextually for supported languages/MIME operations. Contributed commands and providers must use the minimum required activation declarations for the tested VS Code range. No `onStartupFinished`.

### Capabilities

Do not leave aspirational blanket support in the manifest.

After the spike, declare:

- `virtualWorkspaces.supported` based on writable provider tests;
- `untrustedWorkspaces.supported` based on the fact that no workspace code executes, with restrictions if workspace-controlled destinations create risk;
- `browser` only when web behavior passes;
- `extensionKind` based on local clipboard versus remote workspace tests.

`extensionKind` is particularly important: DataTransfer originates where the UI paste occurs, while the asset may be written into a remote workspace. Record which host actually receives the provider call and can apply the resource edit.

Derive the real minimum `engines.vscode` from `DocumentPasteEditProvider`, `DataTransferFile`, and `WorkspaceEdit.createFile(...contents...)` availability, then test that version and current stable.

---

## 11. Security and privacy

Clipboard images can contain highly sensitive material.

Release blockers:

- no network access or cloud upload;
- zero telemetry initially;
- no image bytes/base64, clipboard filenames, destination paths, or alt text in logs;
- no temp files in the API-first implementation;
- no overwrite by default;
- bounded asset size;
- MIME/signature allowlist;
- no arbitrary executable post-processing;
- no shell/environment interpolation;
- settings validated and scoped;
- command/provider inputs validated at runtime;
- cancellation and failure leave no partial/corrupt files;
- remote/virtual writes use VS Code URI/resource-edit APIs;
- workspace trust behavior documented;
- SVG rejected or separately sanitized/reviewed;
- third-party dependencies and licenses reviewed;
- no image optimization/transcoding dependency in `0.1`.

The extension must never read the clipboard continuously. It only sees DataTransfer data during a user-initiated paste.

---

## 12. UX and accessibility

- integrate with native Paste/Paste As widget;
- use clear edit titles such as `Paste image as HTML asset`;
- do not show a notification on every successful paste;
- ask for name/alt text only when configured or explicitly using Paste As;
- errors must name the corrective action without exposing sensitive paths;
- cancellation must be immediate and silent;
- no custom webview;
- settings remain in native VS Code Settings;
- keyboard-only workflow through Paste/Paste As;
- built-in Markdown behavior wins by default;
- status/progress only for unusually large operations;
- document undo behavior with no misleading promise.

---

## 13. Performance and resource budgets

- no startup work;
- no clipboard polling;
- provider eligibility decision under 10 ms before byte read;
- filename/destination/formatter work under 20 ms for normal cases;
- image bytes are not copied more times than required by API/buffering;
- default hard asset limit: 50 MiB pending spike results;
- cancellation checked around byte read and edit resolution;
- no image decode/transcode in `0.1`;
- no long-lived image cache;
- release bundle target below 300 KiB excluding VS Code-provided APIs and no native payloads;
- dispose provider and state cleanly.

---

## 14. Test matrix

### Pure unit tests

- filename sanitization on Windows/POSIX rules;
- reserved names;
- empty/Unicode/very long stems;
- extension normalization;
- template tokens and invalid tokens;
- no environment/shell expansion;
- deterministic collision sequence;
- relative paths across nested folders/drives/URI schemes;
- HTML/CSS/MDX/path-only escaping;
- alt text escaping;
- MIME and magic-byte checks;
- size limits;
- unknown language behavior.

### Provider integration tests

- image MIME eligibility;
- file DataTransfer entry;
- duplicate MIME entries;
- unsupported clipboard content returns no edit;
- provider cancellation;
- resolve selected edit only;
- file create + inserted reference;
- collision failure/race;
- read-only destination;
- untitled/outside-workspace/multi-root document;
- dirty document selection/cursor ranges;
- multiple paste locations;
- Markdown built-in provider ordering;
- undo/redo transaction;
- no partial asset after rejected edit.

### Platform manual matrix

For Windows, macOS, Linux X11/Wayland, WSL, SSH, Codespaces, and web:

- screenshot source;
- browser-copied image;
- file-manager copied image;
- MIME/file metadata;
- bytes/read success;
- destination write;
- relative reference resolves;
- Paste As ordering;
- undo/redo;
- cancellation;
- package-installed behavior.

### Package tests

- Node/browser artifacts match manifest;
- VSIX contains runtime, icon, README, CHANGELOG, LICENSE only as intended;
- no fixtures/screenshots with sensitive data;
- clean-profile install;
- supported platform smoke test from packaged VSIX;
- unsupported environment messaging/listing is accurate.

---

## 15. Ordered ticket backlog

Use these IDs in GitHub Issues, branches, commits, and PR descriptions.

### Feasibility and architecture

#### PIN-001 — Align module format and build artifact layout
Priority: P0  
Depends on: none

Create explicit Node/web build paths, remove ESM/CommonJS ambiguity, update manifest/tasks/launch/ignore, and add packaged activation verification.

#### PIN-002 — Establish desktop/web Extension Host test harness
Priority: P0  
Depends on: PIN-001

Add unit tests, `@vscode/test-electron`, `@vscode/test-web`, fixture workspaces, CI timeouts, and package smoke hooks.

#### PIN-003 — Build DataTransfer inspection spike
Priority: P0  
Depends on: PIN-002

Register a minimal paste provider, record MIME/file/byte metadata safely, and verify `DataTransferFile.data()` and raw image items.

#### PIN-004 — Test binary `WorkspaceEdit.createFile` transaction
Priority: P0  
Depends on: PIN-003

Prove file creation from `DataTransferFile`/`Uint8Array`, inserted reference, cancellation, collision failure, and undo/redo.

#### PIN-005 — Complete platform/remote/web spike matrix
Priority: P0  
Depends on: PIN-003, PIN-004

Run Windows, macOS, Linux variants, WSL, SSH, Codespaces, `vscode.dev`, and relevant virtual workspace tests. Record supported/unsupported evidence.

#### PIN-006 — Approve API-first architecture ADR
Priority: P0  
Depends on: PIN-005

Document selected provider, host location, MIME path, web/platform support, Markdown ordering, undo semantics, and why no native helper is required.

If the spike fails, stop and create a separate product-scope decision before feature implementation.

### Core model and safety

#### PIN-007 — Define paste context, media, destination, and result models
Priority: P0  
Depends on: PIN-006

Create immutable pure types, typed failures, cancellation boundaries, and no-sensitive-data logging contract.

#### PIN-008 — Implement media allowlist and signature validation
Priority: P0  
Depends on: PIN-007

Support only proven formats, reconcile MIME/name/signature, reject SVG/unknown types by policy, and enforce size limits.

#### PIN-009 — Implement filename sanitizer and reserved-name rules
Priority: P0  
Depends on: PIN-007

Cover control characters, separators, Windows names, Unicode, length, empty stems, extensions, and deterministic normalization.

#### PIN-010 — Implement template expansion
Priority: P0  
Depends on: PIN-009

Support only approved tokens, URI-safe context values, validation, and no shell/environment expansion.

#### PIN-011 — Implement collision-safe allocator
Priority: P0  
Depends on: PIN-009, PIN-010

Generate candidates, check destination through URI APIs/resource edits, cap attempts, and fail safely on races.

### Destination and formatting

#### PIN-012 — Implement document/workspace destination resolver
Priority: P0  
Depends on: PIN-010

Handle document directory, workspace folder, multi-root, outside-workspace, untitled, read-only, virtual, and remote contexts.

#### PIN-013 — Implement URI-relative path generator
Priority: P0  
Depends on: PIN-012

Produce syntax-ready `/` paths across platforms/schemes, encode safely, and reject impossible cross-root relationships.

#### PIN-014 — Implement HTML formatter
Priority: P0  
Depends on: PIN-013

Generate escaped `<img>` references with explicit self-closing/alt policy.

#### PIN-015 — Implement CSS/SCSS/Less formatter
Priority: P0  
Depends on: PIN-013

Generate escaped `url(...)` only, with quote policy and path tests.

#### PIN-016 — Implement MDX formatter and policy
Priority: P0  
Depends on: PIN-013

Choose Markdown-style versus JSX-style default, document it, and avoid import generation.

#### PIN-017 — Implement explicit path-only formatter
Priority: P1  
Depends on: PIN-013

Expose only through Paste As/explicit flow for unsupported languages.

### Paste provider and user flow

#### PIN-018 — Define paste kinds, metadata, and Markdown yield policy
Priority: P0  
Depends on: PIN-006

Create unique kinds, MIME metadata, narrow selectors, built-in Markdown precedence, and no duplicate provider options.

#### PIN-019 — Implement DataTransfer candidate extraction
Priority: P0  
Depends on: PIN-008, PIN-018

Select one safe image source, deduplicate entries, preserve laziness, and honor cancellation.

#### PIN-020 — Implement unresolved/resolve paste-edit pipeline
Priority: P0  
Depends on: PIN-011 through PIN-019

Resolve destination/name/reference, create binary resource edit with no overwrite, attach insertion, and avoid filesystem mutation before selection.

#### PIN-021 — Decide and implement command behavior
Priority: P0  
Depends on: PIN-020

Prove stable delegation to native Paste/Paste As or remove/change scaffold commands. Update manifest and docs so every published command works.

#### PIN-022 — Add native settings schema
Priority: P1  
Depends on: PIN-010, PIN-012, PIN-018

Contribute bounded destination, filename, ask-name, path-style, and Markdown opt-in settings with validation.

#### PIN-023 — Implement optional name/alt prompts for explicit Paste As
Priority: P1  
Depends on: PIN-020, PIN-022

Use Input Box only in explicit/configured mode, validate cancellation/escaping, and avoid blocking normal paste.

### Hardening and release

#### PIN-024 — Complete transactional failure and undo/redo tests
Priority: P0  
Depends on: PIN-020

Cover collision race, cancellation, read-only, directory failure, partial edit prevention, modified-asset undo behavior, and redo.

#### PIN-025 — Complete security/privacy review
Priority: P0  
Depends on: PIN-008 through PIN-023

Audit bytes, logs, paths, settings, MIME spoofing, SVG, no network/temp/shell, dependency licenses, and Workspace Trust.

#### PIN-026 — Complete performance/large-image tests
Priority: P0  
Depends on: PIN-020

Measure eligibility, byte read, edit resolution, memory, cancellation, size limit, and no lingering buffers.

#### PIN-027 — Complete supported platform/remote/web integration matrix
Priority: P0  
Depends on: PIN-024 through PIN-026

Repeat the spike with production code and packaged VSIX; set support matrix from evidence.

#### PIN-028 — Derive manifest capabilities, extension host location, and minimum VS Code
Priority: P0  
Depends on: PIN-027

Set `engines.vscode`, `browser`, `capabilities`, `extensionKind`, provider selectors, activation, and platform metadata truthfully.

#### PIN-029 — Replace scaffold README, preview, and Marketplace copy
Priority: P1  
Depends on: production user flow

Document Paste/Paste As, languages, destination/naming, Markdown overlap, undo, privacy, size/formats, platform support, troubleshooting, and real screenshots. Update CHANGELOG.

#### PIN-030 — Harden CI and inspect VSIX
Priority: P0  
Depends on: PIN-002, PIN-027 through PIN-029

Run pure, desktop, web where supported, production build, package contents, clean-profile install, and selected platform smoke tests.

#### PIN-031 — Publish and verify `0.1.0`
Priority: P0  
Depends on: PIN-030

Recheck names, publish Marketplace/Open VSX where compatible, install public artifact, verify Paste As ordering, and monitor platform reports.

### Post-MVP

#### PIN-032 — Evaluate multiple-image paste
Priority: P2  
Depends on: usage evidence and provider behavior

#### PIN-033 — Evaluate WebP/JPEG conversion and optimization
Priority: P2  
Depends on: separate dependency/security/performance PDR

#### PIN-034 — Evaluate JavaScript/TypeScript import generation
Priority: P2  
Depends on: module-system design and demand

#### PIN-035 — Evaluate safe SVG support
Priority: P2  
Depends on: dedicated active-content security review

---

## 16. Launch gate

Do not publish until:

- API-first feasibility is proven on every advertised platform;
- no native helper, shell, or temp-file path is included without separate approval;
- every contributed command works or is removed;
- Markdown built-in behavior is not hijacked by default;
- image bytes are available only during user-initiated paste and never logged/transmitted;
- MIME/signature and size policies are enforced;
- destination/name/collision logic never overwrites by default;
- file creation and text insertion fail transactionally without partial artifacts;
- undo/redo behavior is tested and documented;
- remote/web/virtual/Restricted Mode claims match evidence;
- Node/browser artifacts match manifest;
- minimum VS Code version is derived from current paste APIs and tested;
- packaged VSIX passes clean-profile and real clipboard smoke tests;
- README lists exact supported formats, languages, and environments.

---

## 17. Primary references

- https://code.visualstudio.com/api
- https://code.visualstudio.com/api/references/vscode-api#DocumentPasteEditProvider
- https://code.visualstudio.com/api/references/vscode-api#DataTransfer
- https://code.visualstudio.com/api/references/vscode-api#DataTransferFile
- https://code.visualstudio.com/api/references/vscode-api#WorkspaceEdit
- https://code.visualstudio.com/api/references/extension-manifest
- https://code.visualstudio.com/api/references/activation-events
- https://code.visualstudio.com/docs/languages/markdown#_inserting-images-and-links-to-files
- https://code.visualstudio.com/api/extension-guides/web-extensions
- https://code.visualstudio.com/api/extension-guides/virtual-workspaces
- https://code.visualstudio.com/api/extension-guides/workspace-trust
- https://code.visualstudio.com/api/advanced-topics/extension-host
- https://code.visualstudio.com/api/advanced-topics/remote-extensions
- https://code.visualstudio.com/api/working-with-extensions/testing-extension
- https://code.visualstudio.com/api/working-with-extensions/bundling-extension
- https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- https://github.com/microsoft/vscode-extension-samples
- https://github.com/microsoft/vscode-test-web
- https://marketplace.visualstudio.com/items?itemName=mushan.vscode-paste-image
