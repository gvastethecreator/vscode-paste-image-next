# Paste Image Next — Complete delivery plan

Status: implementation record and release checklist

Repository: `gvastethecreator/vscode-paste-image-next`

Product phase: `0.1.0` release candidate

First public target: `0.1.0`, only after the remaining human release gates pass

Last reviewed: 2026-09-02

This document began as the implementation plan. `docs/PDR.md` now holds the final product contract. Stable `DocumentPasteEditProvider`, `DataTransferFile.data()`, and `WorkspaceEdit.createFile(..., { contents })` are the selected architecture; the implementation uses no shell command, native helper, temporary file, runtime dependency, telemetry, or network access.

---

## 1. Current state

The repository now includes:

- strict TypeScript, pure core modules, and a stable paste provider;
- PNG/JPEG validation, bounded native settings, URI-safe destinations, deterministic names, collision protection, and escaped language formatters;
- one transactional resource/text edit with tested undo, redo, cancellation, read-only, untitled, and late-race behavior;
- Node and browser bundles with desktop and writable virtual-filesystem Extension Host tests;
- Windows, macOS, Linux, minimum-version, stable, Insiders, web, performance, VSIX inspection, and clean-profile package jobs;
- final product/security/development/publishing documentation;
- a transparent geometric icon and a real VS Code runtime preview with native PNG clipboard proof;
- no commands or custom settings webview.

Publication, registry state changes, tags, releases, and remote/Codespaces compatibility claims remain outside this implementation change and require explicit authorization plus their named manual smoke tests.

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

Decision: remove both scaffold commands. Stable VS Code APIs do not expose the current binary paste payload to a custom extension command, and undocumented built-in command delegation is not a product contract.

Normal editor Paste and Paste As are the complete public interaction. The manifest, README, tests, and package contain no extension command.

### Markdown overlap

VS Code already supports pasting images into Markdown and configures destination through `markdown.copyFiles.destination`.

Default policy:

- do not replace or intercept standard Markdown paste by default;
- either exclude Markdown from the provider selector or yield to VS Code's built-in Markdown provider;
- support Markdown only through an explicit Paste As kind or opt-in setting when Paste Image Next adds clear value;
- prioritize HTML, CSS-family files, MDX, and path-only fallback.

---

## 3. Feasibility decision and remaining environment evidence

The API-only design passed synthetic DataTransfer, transaction, browser-host, and writable virtual-filesystem tests. Real OS clipboard metadata and remote-host placement cannot be proven by synthetic fixtures, so they remain explicit release gates rather than hidden assumptions.

### 3.1 Environments

Test:

| Environment | Current evidence / remaining gate |
| --- | --- |
| Windows 11 desktop | Real Ctrl+V with a known native PNG preserved exact bytes and alpha; synthetic failure/transaction coverage also passed. |
| macOS desktop | Hosted stable suite configured; real clipboard smoke remains a release gate. |
| Linux X11 | Hosted minimum/stable/Insiders suite configured; real clipboard smoke remains a release gate. |
| Linux Wayland | Real clipboard smoke remains a release gate. |
| WSL workspace | Packaged local-clipboard/remote-write smoke remains a release gate. |
| Remote SSH | Packaged local-clipboard/remote-write smoke remains a release gate. |
| GitHub Codespaces | Packaged browser/local clipboard and remote-write smoke remains a release gate. |
| `vscode.dev` | Browser host and writable virtual filesystem pass synthetically; manual browser clipboard remains a release gate. |
| `github.dev` | Not advertised; repository write behavior requires a manual test. |

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

### 3.3 Spike outcome

The API-first architecture is accepted for the current release candidate because Windows real clipboard paste, one-operation asset/reference creation, native undo/redo, Markdown ordering, cancellation, collision handling, browser-host execution, and writable virtual filesystems are proven without a shell or native helper.

The original broad desktop criterion also required real macOS clipboard evidence. That and real Linux clipboard evidence remain publication gates, so the release listing must not describe either clipboard path as manually verified yet. Remote-host and Codespaces claims remain similarly limited until their packaged smoke tests pass.

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

- a scheme-wide selector so explicit Paste As can work in any saved document, with automatic edits limited by language policy;
- `pasteMimeTypes` containing proven `image/*` and/or `files` patterns;
- a unique `DocumentDropOrPasteEditKind` hierarchy;
- `providedPasteEditKinds` matching actual returned edits;
- explicit `yieldTo` behavior where VS Code's built-in provider should win.

Provider rules:

- inspect DataTransfer synchronously enough to identify eligibility;
- read `DataTransferFile.data()` before `provideDocumentPasteEdits` returns because VS Code invalidates the transfer afterward;
- retain only the validated byte array and media result in offered edits;
- defer destination allocation and every filesystem mutation to `resolveDocumentPasteEdit` and final edit application;
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

### Final settings

```json
{
  "pasteImageNext.destination": "${documentDir}/assets",
  "pasteImageNext.filename": "image-${date}-${time}",
  "pasteImageNext.askForName": false,
  "pasteImageNext.pathStyle": "documentRelative",
  "pasteImageNext.markdown.enabled": false,
  "pasteImageNext.maximumFileSizeMiB": 50
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
- read-only schemes reject before bytes are read; writable virtual schemes use the same URI/resource-edit path;
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

Implemented structure:

```text
src/
├─ extension.ts
├─ pasteProvider.ts
└─ core/
   ├─ media.ts
   ├─ filename.ts
   ├─ paths.ts
   └─ formatters.ts

test/
├─ integration/
├─ runner/
└─ web/

scripts/
├─ build-web-tests.mjs
├─ inspect-vsix.mjs
└─ performance.mjs
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
- browser: `dist/web/extension.cjs`;
- one browser-safe common core;
- no Node-only path/fs assumptions;
- no platform binaries in initial package.

### Activation

The paste provider uses generic `onLanguage` activation because explicit Paste As path output is available in every saved language. It performs no startup work and does not use `onStartupFinished`.

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

Create unique kinds, MIME metadata, selector/language gating, built-in Markdown precedence, and no duplicate provider options.

#### PIN-019 — Implement DataTransfer candidate extraction
Priority: P0  
Depends on: PIN-008, PIN-018

Select one safe image source, deduplicate entries, preserve laziness, and honor cancellation.

#### PIN-020 — Implement provide/resolve paste-edit pipeline
Priority: P0  
Depends on: PIN-011 through PIN-019

Read and validate DataTransfer bytes within their documented lifetime; then resolve destination/name/reference, create a binary resource edit with no overwrite, attach insertion, and avoid filesystem mutation before selection.

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

### Backlog disposition

- Complete and locally verified: PIN-001 through PIN-004, PIN-006 through PIN-026, and PIN-028 through PIN-030.
- Partially complete by declared environment: PIN-005 and PIN-027 pass on local Windows, the browser host, and a writable virtual filesystem. Real macOS, Linux, WSL, SSH, Dev Containers, Codespaces, and browser clipboard smoke tests remain release gates.
- Pending explicit publication authorization: PIN-031.
- Deferred post-MVP: PIN-032 through PIN-035.

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
