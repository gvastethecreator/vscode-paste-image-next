# Paste Image Next

VS Code extension (`gvastethecreator.paste-image-next`). pnpm. TypeScript in `src/`. esbuild writes Node and browser bundles under `dist/`.

## Commands

- Install: `pnpm install`
- Test: `pnpm test`
- Types: `pnpm run check-types`
- Compile: `pnpm run compile`
- Watch: `pnpm run watch`
- Production bundle: `pnpm run package`
- Media from approved raster: `pnpm run render:media`
- VSIX: `pnpm run vsix`

F5 (`Run Extension`) compiles, then opens `test-workspace/`.

## Rules

- Package manager is pnpm. Do not switch to npm or yarn.
- Product UI strings stay English. Operator chat may be Spanish.
- No webviews. Use Command Palette, Quick Pick, Problems, Tree View, or decorations.
- No telemetry. Do not log secrets, clipboard bytes, or document contents.
- Domain logic lives in `src/core/` with no `vscode` import.
- Product contract: `docs/PDR.md`. Update it in the same change as behavior.
- Do not write tickets under `docs/`. Local tickets: `.scratch/vscode-paste-image-next/issues/`.
- Do not commit, push, or rewrite git history unless the user asks. Scaffold first commit is an exception.

## Agent skills

### Issue tracker

GitHub Issues and the linked GitHub Project hold live state. `.scratch/` holds synchronized local mirrors. See `docs/agents/issue-tracker.md`.

### Triage labels

Category: `bug` or `enhancement`. Triage: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Project status: `Todo`, `In Progress`, `Done`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` plus `docs/adr/`. See `docs/agents/domain.md`.

## Layout

- `src/extension.ts` — paste-provider registration
- `src/pasteProvider.ts` — VS Code paste lifecycle and workspace edit
- `src/core/` — pure logic and tests
- `test/` — desktop, web, and packaged Extension Host suites
- `scripts/` — web-test build, performance, and VSIX inspection
- `test-workspace/` — Extension Host folder
- `docs/PDR.md` — product contract
- `docs/adr/` — architecture decisions
- `docs/agents/` — issue tracker, triage labels, domain docs
