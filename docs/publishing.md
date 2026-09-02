# Publishing Paste Image Next

Extension id: `gvastethecreator.paste-image-next`.

Do not publish, tag, create a release, or upload to a registry without explicit owner authorization.

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

The package command writes `paste-image-next.vsix`. The repository does not contain an automatic publish workflow. The manual **Release candidate** workflow builds and uploads a review artifact only.

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

## Registry upload

After approval, use current official tooling and least-privilege secrets. Publish the same frozen VSIX bytes to each compatible registry; do not rebuild between review and upload.
