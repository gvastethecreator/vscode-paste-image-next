# Paste Image Next context

## Current state

Version 0.1.0 is a release candidate. The product uses VS Code's native Paste and Paste As pipeline to create one PNG or JPEG asset and insert a language-aware reference.

## Invariants

- Normal Markdown paste remains VS Code's behavior by default.
- There are no extension commands, clipboard pollers, native helpers, shell calls, runtime dependencies, network calls, telemetry, or webviews.
- DataTransfer is valid only during the provider request. Read and validate the selected image candidate before that request returns.
- Offering or resolving a paste edit must not write a file. The selected WorkspaceEdit creates the asset and inserts the reference together.
- Existing files are never overwritten. Collisions use deterministic numeric suffixes and late races fail the full edit.
- Use Uri and workspace.fs APIs. Do not introduce raw path or filesystem assumptions into runtime code.
- Keep filename, media, path, destination, and formatting logic pure under `src/core/`.
- Support one image, PNG/JPEG signatures, and source-byte preservation only. Conversion and active-content formats are out of scope.
- Use native Settings. Keep Markdown opt-in and the 1–100 MiB limit bounded.

## Compatibility boundary

Node, browser, and writable virtual-filesystem paths are implemented. Local Windows real-clipboard behavior is verified. Hosted macOS/Linux and manual WSL, SSH, Dev Container, Codespaces, and browser clipboard evidence are release gates; do not advertise them as verified before those runs.

## Durable evidence

- Product contract: `docs/PDR.md`
- Architecture decision: `docs/adr/0001-native-paste-provider.md`
- Platform matrix: `docs/platform-matrix.md`
- Media provenance: `docs/media.md`

Publishing, tags, releases, registry uploads, commits, pushes, and remote tracker changes require explicit owner authorization.
