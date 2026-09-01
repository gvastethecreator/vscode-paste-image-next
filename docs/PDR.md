Repo: `X:\vscode-extensions\paste-image-next`
Remote: private (`gvastethecreator/paste-image-next`)

# PDR — Paste Image Next

## Status
Scaffolded · Priority P0

## Product summary

Paste Image Next turns an image in the system clipboard into a project asset and inserts the correct reference into the current document. The experience should feel like native paste: fast, deterministic, configurable, and safe across project layouts.

## Opportunity

The long-lived Paste Image category proved demand. Many implementations predate current VS Code web, remote, and virtual-workspace guidance.

**Native overlap:** VS Code already pastes clipboard images into Markdown and copies them into the workspace. Setting: `markdown.copyFiles.destination`. Docs: https://code.visualstudio.com/docs/languages/markdown#_inserting-images-and-links-to-files (reviewed 2026-08-19).

v1 must not intercept Markdown Ctrl+V. Remaining job: HTML, CSS, MDX, and JavaScript/TypeScript insertion, naming policy, and desktop clipboard bytes. `vscode.env.clipboard` exposes `readText` and `writeText` only.

Historical category reference:
- https://marketplace.visualstudio.com/items?itemName=mushan.vscode-paste-image

## Target users

- Markdown/MDX writers;
- documentation maintainers;
- frontend developers;
- developers taking screenshots for issues/docs/tests;
- note-taking workflows inside repositories.

## Core job

From an active editor, invoke one command and turn the current clipboard image into:

1. a correctly named image file;
2. written to a predictable destination;
3. referenced at the cursor using syntax appropriate to the current language.

## MVP workflow

1. User copies an image/screenshot.
2. Runs `Paste Image Next: Paste Image`.
3. Extension resolves destination from workspace/document/settings.
4. Extension creates a collision-safe filename.
5. Image bytes are written.
6. Appropriate reference is inserted at current selection/cursor.
7. Undo should remove the text edit; asset cleanup behavior must be explicit and never destructive by surprise.

## Supported insertion modes

MVP (do not steal Markdown Ctrl+V):

- HTML: `<img src="..." alt="...">`
- MDX: JSX `<img>` or Markdown syntax by setting
- Markdown command path only if the user runs Paste Image Next on a `.md` file and native paste is insufficient
- CSS/SCSS/Less: `url("...")`
- JavaScript/TypeScript: optional path-only insertion in v1; import generation may be post-MVP because module semantics vary.

Unknown languages default to path insertion or Quick Pick rather than guessing.

## File formats

MVP should preserve a clipboard image in a lossless, predictable format, preferably PNG when conversion is required.

WebP/JPEG conversion is post-MVP unless the chosen platform implementation makes it low-risk and dependency-light.

## Naming templates

Default example:

```text
image-2026-09-01-143501.png
```

Template tokens may include:

- date/time;
- active document basename;
- counter;
- sanitized user-provided stem.

Requirements:

- sanitize path separators/reserved characters;
- handle Windows reserved filenames;
- avoid overwrite by default;
- deterministic collision suffixing.

## Destination policy

Proposed setting model:

```json
{
  "pasteImageNext.destination": "${documentDir}/assets",
  "pasteImageNext.filename": "image-${date}-${time}",
  "pasteImageNext.markdownPathStyle": "relative",
  "pasteImageNext.askForName": false,
  "pasteImageNext.overwrite": "never"
}
```

Potential tokens:

- `${workspaceFolder}`
- `${documentDir}`
- `${documentName}`

Do not permit arbitrary shell/environment expansion in path templates.

## Commands

- `Paste Image Next: Paste Image`
- `Paste Image Next: Paste Image As...`
- `Paste Image Next: Copy Asset Path` (post-MVP candidate)

## Explicit non-goals

- cloud image hosting;
- image CDN upload;
- screenshot capture UI;
- full image editor;
- OCR;
- automatic optimization pipeline in v1;
- background watching of clipboard contents;
- arbitrary executable conversion commands.

## Architecture challenge: clipboard image access

Text clipboard access through VS Code is straightforward; binary image clipboard access is not uniformly exposed as a simple stable cross-platform VS Code API. This is the core feasibility spike for this project.

Before implementation, prototype platform strategies and choose one of these product positions:

1. **Desktop-first extension** using minimal platform-specific clipboard integration, with web unsupported.
2. **Companion/helper strategy** only if unavoidable, but avoid daemons/installers for v1.
3. If stable VS Code APIs have evolved by implementation time, prefer them and revise this PDR.

Do not claim web compatibility until binary clipboard behavior is proven.

## Platform strategy requirements

- Windows/macOS/Linux behavior documented separately;
- no shell-command interpolation from workspace-controlled settings;
- temporary files cleaned reliably if used;
- clipboard data never transmitted;
- native helper dependency, if any, must have active maintenance and clear licensing;
- packaged binaries would require architecture matrix and substantially increase maintenance burden, so avoid them if possible.

## VS Code APIs

Likely:

- `window.activeTextEditor`
- `WorkspaceEdit`
- `workspace.fs`
- `Uri`
- configuration APIs
- commands
- Quick Pick/Input Box
- progress notification only for operations slow enough to justify it.

## Relative path rules

Path generation must be tested for:

- Windows drive letters;
- POSIX paths;
- spaces/unicode;
- nested document/asset directories;
- multi-root workspaces;
- remote URIs;
- non-file URI schemes if supported.

Inserted source paths should use URI/path conventions appropriate to target syntax, not host OS separators blindly.

## Security/privacy

Clipboard images can be sensitive.

- bytes stay local;
- no telemetry about image contents/names;
- no implicit cloud upload;
- destination is always visible/predictable;
- never overwrite without explicit configured/user choice;
- sanitize all generated paths;
- no executable post-processing from workspace configuration in v1.

## Compatibility

| Environment | Goal |
| --- | --- |
| Desktop Windows | Full |
| Desktop macOS | Full |
| Desktop Linux | Full if clipboard strategy supports it reliably |
| Web/vscode.dev | Unsupported unless stable binary clipboard path exists |
| Virtual Workspace | Limited; depends on clipboard strategy and writable `workspace.fs` |
| Restricted Mode | Paste/write may be supported if no workspace code executes; restrict dangerous settings if introduced |
| Remote/Codespaces | Must distinguish local clipboard from remote workspace filesystem and test explicitly |

The local-clipboard/remote-workspace split is a key acceptance scenario.

## Undo semantics

Text insertion participates in editor undo naturally. The created binary file cannot safely be coupled to editor undo without potentially deleting a file the user has since modified or referenced.

Policy for v1:

- editor undo removes only inserted text;
- created asset remains;
- document this clearly;
- optional `Delete Last Pasted Image` command may be considered later with strict safety checks.

## Testing

Unit:

- filename sanitization;
- template expansion;
- collision policy;
- relative path computation;
- insertion syntax by language;
- Windows/POSIX cases;
- multi-root resolution.

Integration/manual matrix:

- Windows clipboard screenshot;
- macOS screenshot;
- common Linux clipboard environments where supported;
- local workspace;
- WSL/SSH/Codespaces where feasible;
- untitled document;
- document outside workspace;
- read-only destination;
- clipboard without image;
- duplicate filename;
- unicode paths.

## Acceptance criteria

- one primary command from clipboard to inserted reference;
- never overwrites an asset by default;
- generated references resolve correctly from current document;
- no clipboard/image network transfer;
- Windows/macOS/Linux support truthfully documented;
- remote-workspace behavior is tested rather than assumed;
- failures never leave corrupt partial files;
- temporary resources are cleaned.

## Post-MVP

- WebP/JPEG conversion;
- configurable quality;
- automatic dimension metadata;
- MDX/React import mode;
- paste multiple clipboard images if platform permits;
- asset optimization adapters, but only as explicit opt-in actions;
- smart alt-text prompt without external AI dependency.

## Definition of done

Feasibility spike for binary clipboard complete, platform support matrix proven, implementation/tests/docs/package/assets/release automation complete, and limitations prominent in Marketplace listing.
