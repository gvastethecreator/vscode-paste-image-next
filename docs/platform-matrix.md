# Platform evidence

Last updated: 2026-09-02.

Do not convert “API-only” into a compatibility claim without a real or hosted test. This table separates current evidence from release gates.

| Environment | Current evidence | Status before publication |
| --- | --- | --- |
| Windows desktop | Synthetic Extension Host suite passed on 1.136. A real Ctrl+V from the Windows clipboard created the PNG and HTML reference with exact source-byte integrity. | Verified locally |
| macOS desktop | Same Node bundle and URI-only code path. Hosted stable job is configured. | Await hosted CI and real clipboard smoke |
| Linux desktop | Same Node bundle and URI-only code path. Hosted minimum/stable/Insiders jobs are configured. | Await hosted CI and X11/Wayland clipboard smoke |
| Web host | Official browser Extension Host suite passed. | Verified with synthetic DataTransfer |
| Writable virtual filesystem | Non-file URI created the binary asset and changed the document in one workspace edit. | Verified with synthetic DataTransfer |
| Read-only virtual filesystem | Integration test rejects the destination before reading image bytes, offering an edit, or writing. | Unsupported by design, correctly handled |
| Restricted Mode | Runtime has no execution, network, shell, native helper, or trust-sensitive operation. Manifest declares support. | Review packaged behavior before publication |
| WSL / Remote SSH / Dev Container | Host preference and workspace.fs path are implemented. | Packaged remote smoke required |
| Codespaces | Browser and remote bundles exist. | Packaged browser/remote smoke required |
| vscode.dev / github.dev | Browser bundle is implemented; write depends on the active filesystem provider. | Manual browser clipboard and repository-write smoke required |

The Windows real-clipboard run used a known project icon and did not inspect or retain prior clipboard content. Scratch copies are not part of the product or VSIX.
