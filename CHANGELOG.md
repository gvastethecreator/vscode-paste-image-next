# Changelog

## [Unreleased]

- Fixed: the unsupported-media message lists PNG, JPEG, WebP, and GIF.
- Paste offers no edit in documents without a writable file system, such as notebook cells, and keeps native paste.
- The paste provider accepts original PNG, JPEG, WebP and GIF bytes supplied by VS Code. It validates the MIME, extension and container signature, preserves the supplied bytes, and does not decode or transcode images. An original WebP/GIF representation takes priority over a PNG representation. The details flow suggests a safe source filename and editable alt text. Empty alt text remains valid for decorative images. Document changes during prompts reject the edit. Native Markdown paste retains priority; multi-file drop remains outside this release.

## 0.1.0 — Unreleased

- Added a Set Defaults command that writes factory settings to user and workspace scope.
- Paste one PNG or JPEG into HTML, CSS, SCSS, Less, or MDX through VS Code's native paste flow.
- Add explicit Paste As choices for names, alt text, Markdown, and path-only output.
- Create assets and references as one no-overwrite workspace edit with deterministic collision names.
- Add bounded native settings for destination, file names, paths, Markdown participation, and file size.
- Preserve VS Code's built-in Markdown image paste by default.
- Support Node and browser extension hosts with writable virtual filesystems.
- Add unit, desktop, web, performance, package, and clean-profile VSIX checks.
- Replace the scaffold icon and preview with transparent production assets.
