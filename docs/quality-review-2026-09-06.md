# Paste Image Next — additional quality and competitive review

Review date: 2026-09-06. Baseline: `16663bde7bfca740786e93811beee266b0170f8d` (`main`).

## Status and evidence boundaries

This document specifies proposed improvements and validation, not implemented behavior. Live task state belongs in the accompanying PR. The shipped PDR is unchanged; implementation requires updating the product and portfolio contracts together.

Authenticated re-review covered the current ref, AGENTS, extension registration/reset, paste-provider lifecycle and publication steps. The provider/registration blobs retain the behavior identified previously: PNG/JPEG inputs, native paste edits, no registered drop provider and a Global-plus-Workspace reset. No build, native clipboard test, browser test, installed VSIX or benchmark ran. Local checkout was blocked by DNS and pnpm was unavailable.

Pinned sources: [registration and reset](https://github.com/gvastethecreator/vscode-paste-image-next/blob/16663bde7bfca740786e93811beee266b0170f8d/src/extension.ts), [paste lifecycle](https://github.com/gvastethecreator/vscode-paste-image-next/blob/16663bde7bfca740786e93811beee266b0170f8d/src/pasteProvider.ts), [release](https://github.com/gvastethecreator/vscode-paste-image-next/blob/16663bde7bfca740786e93811beee266b0170f8d/.github/workflows/release.yml).

## Preserve the native transaction

Keep `DocumentPasteEditProvider`, deferred resolution, URI-based destinations, signature/MIME validation, non-overwriting allocation and the file/reference `WorkspaceEdit`. Preserve native Markdown priority and the distinction between normal paste and explicit Paste As. Filename templates, path styles and optional detail prompts already exist; they are not missing features.

[Custom Paste Image](https://marketplace.visualstudio.com/items?itemName=VidraSec.custom-paste-image), rechecked on the review date, documents retaining copied-file format/name and using selected text for alt/name suggestions. [VS Code Markdown](https://code.visualstudio.com/docs/languages/markdown) already provides image copy/drop and destination configuration. Adopt the useful input conveniences without duplicating native Markdown or introducing platform clipboard executables.

## Original WebP and GIF support

Extend the input model, supported MIME list and lightweight structural validation for original WebP files first, then GIF. Copy the supplied bytes unchanged; no decoding, compression, conversion or metadata rewriting is required. Use checked bounds when reading headers/container lengths and reject malformed, truncated or inconsistent MIME/extension/signature combinations. Do not describe shallow format validation as a complete image-decoder security audit.

Prefer a real file representation when the host offers both it and a bitmap representation. Document precisely that original-format/animation preservation is possible only when `DataTransfer` provides those original bytes. A clipboard exposing only PNG pixels cannot restore the original WebP/GIF or animation. Continue to enforce size limits and reject unavailable/read-only destinations.

Touchpoints: `src/extension.ts`, `src/core/media.ts`, filename extension types, the provider's allocation model and existing unit/host fixtures. Test equality using byte hashes, including alpha and animated sample files. No codec or native executable belongs in the runtime package.

## Drop as a second input to the same edit plan

A later `DocumentDropEditProvider` can reuse the existing destination/filename/reference planning for HTML, CSS-family documents and MDX. Extract only the shared planning that is actually needed; do not create a generic pipeline framework. Native Markdown remains authoritative unless the user explicitly chooses this extension's alternative.

Specify multi-file behavior before implementation: either a single atomic batch with deterministic reference ordering or a clear rejection/selection flow. Never silently save only the first file from a multi-file drop. Do not eagerly create directories/assets during offer generation. Cancellation or choosing another provider must produce no filesystem side effects.

## Better filename and alt suggestions

Use an original file stem when available, sanitized by the existing filename rules. Seed alt text from a captured selection only as an editable suggestion, not an inferred image description. Handle blank/decorative alt explicitly. Preserve per-format escaping for Markdown, HTML, MDX and CSS. Revalidate the document version and relevant settings after user prompts and asynchronous allocation; a stale suggestion must not be applied to a different selection/document state.

## Configuration-scope correction

`setDefaultSettings` currently writes defaults to Global and Workspace. A reset should instead clearly select one scope and remove that scope's overrides when restoring inheritance. Folder-specific configuration must use the selected resource; unrelated roots and language overrides must remain untouched. Distinguish a reset from intentionally pinning explicit defaults. Cancel before writes, serialize updates and accurately report partial configuration failures.

## Publication findings

The inspected GitHub Release job invokes `gh release` without checkout or explicit repository identity and does not bind tag creation to the verified source commit. Its release-existence probe is not a tag-ref check and treats any false result alike. Downloaded checksum sidecars are not explicitly verified by the shown publication consumers.

Require `GH_REPO`/explicit repo, preparation-stage source SHA, tag-ref validation, fail-closed API failures and checksum verification before every publisher. Preserve the verified artifact, protected environments and artifact-only default. Never move an existing tag or publish while testing these changes. References: [CLI environment](https://cli.github.com/manual/gh_help_environment), [release target behavior](https://cli.github.com/manual/gh_release_create).

## Regression and compatibility contract

| Scenario | Required outcome |
| --- | --- |
| Original WebP/GIF provided as a file | Saved bytes equal input bytes and extension agrees with validated format. |
| Clipboard provides only a PNG bitmap | Save the received format; do not claim original-format or animation recovery. |
| Truncated/invalid signature, excessive size | Reject safely without creating an asset. |
| Filename collision or concurrent creation | No overwrite; deterministic retry or clear failure. |
| Cancel naming/alt dialog or choose another paste provider | No orphan asset or partial reference. |
| Edit document while deferred paste resolves | Revalidate and abort stale work; no reference inserted into changed context. |
| Undo/redo after accepted paste/drop | File and reference follow the host's coherent edit operation; verify actual provider behavior. |
| Multiple dropped files | Explicit policy; no silently discarded items. |
| Native Markdown normal paste | No priority regression or duplicate asset. |
| Global/workspace/folder reset | Only the chosen scope changes. |
| Tampered VSIX or mismatched tag | Abort before publication. |

Exercise desktop and web hosts, local and writable virtual/remote filesystems, long Windows paths, escaped names and multi-root workspaces. Browser clipboard permissions and MIME availability are separate from file-copy support; report unsupported paths honestly. Reuse existing quality, integration, web and installed-package suites. Record source SHA, package checksum and host versions; measure first-paste latency and retained large-byte buffers after cancellation, not just module loading. No performance measurement is claimed by this review.

## Exclusions

No Sharp runtime dependency, ImageMagick, FFmpeg, codec WASM, clipboard shell scripts, CDN uploads, remote URL downloader, image-caption service, persistent clipboard history or asset-manager UI. Keep the extension small by sharing its own existing edit logic and relying on the host.
