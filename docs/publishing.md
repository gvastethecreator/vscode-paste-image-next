# Publishing Paste Image Next

Extension id: `gvastethecreator.paste-image-next`.

Do not publish, tag, create a release, or upload to a registry without explicit owner authorization.

The **Release** workflow starts from **Actions → Release → Run workflow**. Default input `artifact-only` does not publish.

## Build the candidate

```powershell
pnpm install --frozen-lockfile
pnpm run quality
pnpm run test:integration
pnpm run test:web
pnpm run vsix
pnpm run inspect:vsix
pnpm run test:vsix
```

The package command writes `paste-image-next.vsix`.

## Human release gates

- Review the exact staged diff and package file list.
- Install the frozen VSIX into a clean VS Code profile.
- Paste a real OS screenshot into HTML and verify the created asset and reference.
- Verify Markdown still uses VS Code's built-in behavior by default.
- Verify undo and redo remove and restore both the reference and asset.
- Run packaged smoke tests for every advertised remote or Codespaces environment.
- Confirm the icon and preview match the final runtime.
- Check the Marketplace and Open VSX name/ownership state.
- Approve the version, release notes, commit, tag, registry uploads, and GitHub Release separately.

## GitHub Actions

1. Run **Release** with `artifact-only` from `main`.
2. After approval, run one of `github-release`, `vscode-marketplace`, or `open-vsx`.
3. Run one registry at a time.

Environments `github-release`, `vscode-marketplace`, and `open-vsx` accept `main` only. Do not store `VSCE_PAT` or `OVSX_PAT` until the owner asks to publish.

## Registry upload

After approval, publish the same frozen VSIX bytes to each compatible registry. Do not rebuild between review and upload.

Marketplace: upload the exact verified VSIX at [Marketplace management](https://marketplace.visualstudio.com/manage).

Open VSX:

```powershell
pnpm exec ovsx publish .\paste-image-next.vsix -p $env:OVSX_PAT
```

Never place a PAT in a command, an issue, a log, or a document.

## Rollback

Prefer a forward patch. Do not rewrite a public tag or replace bytes under an existing version.
