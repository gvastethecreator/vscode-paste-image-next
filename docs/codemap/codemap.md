# Code map · vscode-paste-image-next

generated: 2026-09-05T04:45:27Z
commit: b533ee0cb408
scope: .

counts: 6 nodes · 7 edges · 0 flows · 0 unknown

## Modules

- `esbuild` · `esbuild.cjs` · interface · Esbuild
  callers: repository (calls)
  callees: external-dependencies (imports)
  tests: (none)
  entry: esbuild.cjs:main

- `external-dependencies` · `esbuild.cjs` · external · External
  callers: esbuild (imports), scripts (imports), src (imports)
  callees: (none)
  tests: (none)
  entry: esbuild.cjs:esbuild

- `repository` · `package.json` · module · Repository
  callers: (none)
  callees: esbuild (calls), scripts (calls)
  tests: (none)
  entry: package.json:{

- `scripts` · `scripts` · service · Scripts
  callers: repository (calls)
  callees: external-dependencies (imports), src-core (imports)
  tests: (none)
  entry: scripts/build-web-tests.mjs:root

- `src` · `src` · module · Src
  callers: (none)
  callees: external-dependencies (imports), src-core (imports)
  tests: test/web/suite/index.ts
  entry: src/extension.ts:setDefaultSettings

- `src-core` · `src/core` · service · Src
  callers: scripts (imports), src (imports)
  callees: (none)
  tests: src/core/filename.test.ts, src/core/formatters.test.ts, src/core/media.test.ts, src/core/paths.test.ts
  entry: src/core/filename.ts:buildFilename

## Edges

- esbuild -> external-dependencies · imports
- repository -> esbuild · calls
- repository -> scripts · calls
- scripts -> external-dependencies · imports
- scripts -> src-core · imports
- src -> external-dependencies · imports
- src -> src-core · imports

## Unknown

- none

## Flows

- none
