Repo: X:\vscode-extensions\vscode-paste-image-next
Remote: private (gvastethecreator/vscode-paste-image-next)

# PDR — Paste Image Next

## Status

Release candidate implementation · 0.1.0 · not published

The feature, tests, browser bundle, package checks, and release-candidate workflow are implemented. Public publication and the manual remote matrix remain separate release gates.

## Product summary

Paste Image Next turns one PNG or JPEG supplied by VS Code during a user-initiated paste into a project asset and inserts a reference suited to the active document. It uses VS Code's native Paste and Paste As flow, stays local, and adds no custom settings page or webview.

## Product position

VS Code already handles image paste in Markdown. Paste Image Next does not replace that behavior.

Its primary job is image paste for HTML, CSS, SCSS, Less, and MDX. Explicit Paste As also provides Markdown and path-only choices without guessing in unknown languages.

## User flow

### Normal paste

1. Copy one supported image.
2. Paste in an HTML, CSS, SCSS, Less, or MDX editor.
3. VS Code requests the extension's paste edit.
4. The selected edit creates the asset and inserts its reference as one workspace transaction.

Normal Markdown paste remains native by default. Unknown languages receive no automatic edit.

### Paste As

Paste As offers:

- the language-appropriate asset reference;
- a detailed variant that asks for the file name;
- alt text when the format supports it;
- Markdown syntax in Markdown;
- an encoded relative path in other languages.

Canceling an input prompt is silent and creates nothing.

## Supported inputs

- one DataTransferFile per paste;
- image/png;
- image/jpeg and image/jpg;
- file entries with a .png, .jpg, or .jpeg name when their MIME is generic;
- maximum size of 50 MiB by default, configurable from 1 to 100 MiB.

The extension preserves the source bytes. It does not decode, transcode, optimize, upload, or execute image data. SVG, GIF, WebP, unknown image MIME types, empty files, and conflicting MIME/name/signature combinations are rejected.

## Inserted references

| Language | Automatic result |
| --- | --- |
| HTML | <img src="./assets/image.png" alt=""> |
| CSS, SCSS, Less | url("./assets/image.png") |
| MDX | <img src="./assets/image.png" alt="" /> |
| Markdown | Native VS Code behavior; extension yields by default |
| Other | No automatic edit; Paste As can insert the path |

Paths always use forward slashes. URI segments are encoded. HTML attributes, CSS strings, Markdown alt text, and MDX attributes are escaped for their target syntax.

## Settings

All settings use VS Code's native Settings UI.

| Setting | Default | Contract |
| --- | --- | --- |
| pasteImageNext.destination | ${documentDir}/assets | Asset directory relative to the document or active workspace |
| pasteImageNext.filename | image-${date}-${time} | File-name template |
| pasteImageNext.askForName | false | Ask for a name after the edit is selected |
| pasteImageNext.pathStyle | documentRelative | documentRelative or workspaceRelative |
| pasteImageNext.markdown.enabled | false | Offer the extension during normal Markdown paste while yielding to VS Code |
| pasteImageNext.maximumFileSizeMiB | 50 | Integer from 1 to 100 |

Destination tokens: ${documentDir}, ${workspaceFolder}, and ${documentName}.

Filename tokens: ${date}, ${time}, ${documentName}, ${name}, and ${counter}.

No environment variables, shell expansion, URI schemes, absolute paths, or parent traversal are accepted.

## Destination and naming rules

The default destination is an assets folder beside the active document. A workspace token resolves to the workspace folder containing that document, including multi-root workspaces.

Documents outside a workspace may write only within their own directory. Untitled documents, read-only filesystems, invalid settings, and destinations outside the allowed root fail with an actionable message.

File stems are Unicode-aware, capped at 96 characters, normalized for unsafe punctuation, and protected from Windows reserved names. Destination settings and segments have conservative length limits. Existing files are never overwritten. Collisions use deterministic suffixes:

- image.png
- image-2.png
- image-3.png

A file appearing after allocation causes the whole edit to fail instead of being overwritten.

## Architecture

- Stable DocumentPasteEditProvider and DataTransferFile APIs.
- WorkspaceEdit.createFile with binary contents and no overwrite.
- Node bundle: dist/node/extension.cjs.
- Browser bundle: dist/web/extension.cjs.
- Browser-safe core with no Node runtime dependency.
- Pure filename, media, destination, path, and formatter modules under src/core.
- Lazy onLanguage activation with no startup scan.
- Provider registered through VS Code APIs only.
- No commands because stable VS Code APIs do not expose a safe custom command that invokes native binary paste.
- No native helper, shell, temporary file, daemon, network request, telemetry, or runtime dependency.
- Host preference: ui first, workspace second. VS Code APIs route filesystem work to the active workspace, while the browser bundle covers web hosts.

## Markdown policy

Normal Markdown Ctrl+V is not intercepted by default. Explicit Paste As always exposes the extension's Markdown edit.

If pasteImageNext.markdown.enabled is enabled, the extension may participate in normal Markdown paste but declares that VS Code's markdown.link.image edit wins.

## Undo and redo

The asset creation and reference insertion are one native workspace edit.

- Undo removes both the inserted reference and the created asset.
- Redo restores both.
- If the asset was modified after creation, undo still removes it and redo restores the modified bytes.

This behavior is covered by an Extension Host integration test and must be stated in the Marketplace listing.

## Security and privacy

- Image bytes are read only inside a user-initiated paste request. VS Code invalidates DataTransfer after the provider returns, so eligible bytes are validated before options are returned; the filesystem is not touched until an option is selected.
- No background clipboard polling.
- No network access or cloud upload.
- No telemetry or content logging.
- No document text, image bytes, names, paths, or alt text are logged.
- No execution of workspace code, commands, binaries, or settings.
- Bounded media size and collision attempts.
- Runtime validation of MIME, signature, names, settings, destination, writability, cancellation, and document version.
- PNG and JPEG only; active-content SVG is rejected.
- Restricted Mode is supported because no workspace code executes.
- Runtime bundles contain no third-party production dependency.

## Compatibility

| Environment | Declaration | Evidence or release gate |
| --- | --- | --- |
| Desktop Node host | Supported | Local Windows stable and minimum-version Extension Host tests passed; the minimum/stable/macOS/Linux hosted matrix is configured as a merge gate |
| Web host | Supported | Browser bundle exercised with the official web test host |
| Writable virtual workspace | Supported | Binary create and text insertion tested on a non-file filesystem |
| Read-only virtual workspace | Unsupported by design | Rejected before image bytes are read, an edit is offered, or any mutation occurs |
| Restricted Mode | Supported | No execution, shell, network, or trust-sensitive operation |
| WSL, SSH, Dev Containers | Intended support | API-only path; manual packaged test required before advertising as verified |
| Codespaces | Intended support | Browser/remote packaged test required before advertising as verified |
| Platform-specific behavior | None in runtime | Windows, macOS, and Linux hosted tests gate merge |

The release listing must distinguish tested local/web behavior from remote scenarios that have not received a real packaged smoke test.

## Performance budgets

- no activation work beyond provider registration;
- eligibility before byte read under 10 ms;
- normal pure planning under 20 ms;
- Node and web bundles each below 300 KiB;
- no persistent image cache;
- one source-byte read;
- cancellation checked before and after asynchronous work;
- at most 100 collision candidates.

## Verification contract

Release checks cover:

- pure unit tests for media, names, tokens, paths, formatters, limits, and escaping;
- desktop Extension Host tests for activation, eligibility, filtering, no pre-selection mutation, transactions, collision races, cancellation, Markdown ordering, untitled/read-only failures, and modified-asset undo/redo;
- browser Extension Host test against a writable virtual filesystem;
- current stable plus declared minimum VS Code;
- Windows, macOS, and Linux hosted jobs;
- production bundles and performance budgets;
- minimal VSIX contents and alpha-bearing 256 px icon / 1200 by 800 preview;
- clean-profile VSIX installation and activation.

Non-Windows real OS clipboard smoke tests and remote/Codespaces verification remain human release gates because synthetic DataTransfer tests cannot prove operating-system clipboard metadata.

## Non-goals for 0.1.0

- Markdown replacement;
- multiple images per paste;
- WebP, GIF, SVG, or conversion;
- JavaScript/TypeScript import generation;
- screenshot capture UI;
- image editing or optimization;
- OCR or AI alt text;
- cloud hosting or CDN upload;
- overwrite mode;
- custom settings UI or webview;
- cleanup commands.

## Definition of done

The implementation is complete when source, tests, docs, icon, runtime preview, Node/browser bundles, CI, and inspected VSIX agree with this contract. Publication requires separate authorization plus real clipboard and advertised-environment smoke tests.
