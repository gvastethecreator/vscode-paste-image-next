# Code map: vscode-paste-image-next

Generated: 2026-09-07T03:20:43Z | Commit: `16663bde7bfc` | Schema: 2
Generation: `9c6722bca6f2920f8129df577e8c4b933f4e16d80f6952a373dee804fc3f2c70`
Scope: . | Inventory: working-tree
Nodes: 43 | Edges: 116 | Flows: 0

## Coverage

- Analysis: **partial**; 26 analyzed of 27 included files.
- Configuration files: 1; omitted untracked files: 0.
- Unresolved references and analysis limits: 210.
- Static references and call paths do not prove runtime execution or test coverage.

## Modules

- `esbuild.cjs` | module | Repository | callers: none | callees: external:javascript:esbuild, external:javascript:esbuild | tests: 0 | entry: none
- `external:javascript:@vscode/test-electron` | external | External | callers: test/integration/run-vsix.mjs, test/integration/run-vsix.mjs, test/integration/run.mjs, test/integration/run.mjs | callees: none | tests: 2 | entry: none
- `external:javascript:@vscode/test-web` | external | External | callers: test/web/run.mjs, test/web/run.mjs | callees: none | tests: 1 | entry: none
- `external:javascript:esbuild` | external | External | callers: esbuild.cjs, esbuild.cjs, scripts/build-web-tests.mjs, scripts/build-web-tests.mjs | callees: none | tests: 0 | entry: none
- `external:javascript:node:assert` | external | External | callers: scripts/check-media.mjs, scripts/inspect-vsix.mjs, scripts/performance.mjs, scripts/release-artifact.mjs | callees: none | tests: 5 | entry: none
- `external:javascript:node:child_process` | external | External | callers: scripts/release-artifact.mjs, scripts/release-artifact.mjs, test/integration/run-vsix.mjs, test/integration/run-vsix.mjs | callees: none | tests: 1 | entry: none
- `external:javascript:node:crypto` | external | External | callers: scripts/release-artifact.mjs, scripts/release-artifact.mjs | callees: none | tests: 0 | entry: none
- `external:javascript:node:fs` | external | External | callers: scripts/check-media.mjs, scripts/check-media.mjs, scripts/inspect-vsix.mjs, scripts/inspect-vsix.mjs | callees: none | tests: 2 | entry: none
- `external:javascript:node:os` | external | External | callers: test/integration/run-vsix.mjs, test/integration/run.mjs | callees: none | tests: 2 | entry: none
- `external:javascript:node:path` | external | External | callers: scripts/build-web-tests.mjs, scripts/check-media.mjs, scripts/inspect-vsix.mjs, scripts/performance.mjs | callees: none | tests: 4 | entry: none
- `external:javascript:node:perf_hooks` | external | External | callers: scripts/performance.mjs | callees: none | tests: 0 | entry: none
- `external:javascript:node:test` | external | External | callers: src/core/filename.test.ts, src/core/filename.test.ts, src/core/formatters.test.ts, src/core/formatters.test.ts | callees: none | tests: 4 | entry: none
- `external:javascript:node:url` | external | External | callers: scripts/build-web-tests.mjs, scripts/build-web-tests.mjs, scripts/check-media.mjs, scripts/check-media.mjs | callees: none | tests: 3 | entry: none
- `external:javascript:node:zlib` | external | External | callers: scripts/inspect-vsix.mjs, scripts/inspect-vsix.mjs | callees: none | tests: 0 | entry: none
- `external:javascript:sharp` | external | External | callers: scripts/check-media.mjs, scripts/check-media.mjs, scripts/render-media.mjs, scripts/render-media.mjs | callees: none | tests: 0 | entry: none
- `external:javascript:vscode` | external | External | callers: src/extension.ts, src/pasteProvider.ts, src/settingsActions.ts, test/integration/suite/index.cjs | callees: none | tests: 2 | entry: none
- `external:javascript:yauzl` | external | External | callers: scripts/inspect-vsix.mjs | callees: none | tests: 0 | entry: none
- `package.json` | module | Repository | callers: none | callees: none | tests: 0 | entry: none
- `scripts/build-web-tests.mjs` | module | Repository | callers: none | callees: external:javascript:esbuild, external:javascript:esbuild, external:javascript:node:path, external:javascript:node:url | tests: 0 | entry: none
- `scripts/check-media.mjs` | module | Repository | callers: none | callees: external:javascript:node:assert, external:javascript:node:fs, external:javascript:node:fs, external:javascript:node:path | tests: 0 | entry: none
- Showing 20 of 43 nodes. Query `impact --module <path>` or open the HTML hierarchy for the rest.

## Edges

- `esbuild.cjs` -> `external:javascript:esbuild` | calls
- `esbuild.cjs` -> `external:javascript:esbuild` | imports
- `scripts/build-web-tests.mjs` -> `external:javascript:esbuild` | calls
- `scripts/build-web-tests.mjs` -> `external:javascript:esbuild` | imports
- `scripts/build-web-tests.mjs` -> `external:javascript:node:path` | imports
- `scripts/build-web-tests.mjs` -> `external:javascript:node:url` | calls
- `scripts/build-web-tests.mjs` -> `external:javascript:node:url` | imports
- `scripts/check-media.mjs` -> `external:javascript:node:assert` | imports
- `scripts/check-media.mjs` -> `external:javascript:node:fs` | calls
- `scripts/check-media.mjs` -> `external:javascript:node:fs` | imports
- `scripts/check-media.mjs` -> `external:javascript:node:path` | imports
- `scripts/check-media.mjs` -> `external:javascript:node:url` | calls
- `scripts/check-media.mjs` -> `external:javascript:node:url` | imports
- `scripts/check-media.mjs` -> `external:javascript:sharp` | calls
- `scripts/check-media.mjs` -> `external:javascript:sharp` | imports
- `scripts/inspect-vsix.mjs` -> `external:javascript:node:assert` | imports
- `scripts/inspect-vsix.mjs` -> `external:javascript:node:fs` | calls
- `scripts/inspect-vsix.mjs` -> `external:javascript:node:fs` | imports
- `scripts/inspect-vsix.mjs` -> `external:javascript:node:path` | imports
- `scripts/inspect-vsix.mjs` -> `external:javascript:node:url` | calls
- `scripts/inspect-vsix.mjs` -> `external:javascript:node:url` | imports
- `scripts/inspect-vsix.mjs` -> `external:javascript:node:zlib` | calls
- `scripts/inspect-vsix.mjs` -> `external:javascript:node:zlib` | imports
- `scripts/inspect-vsix.mjs` -> `external:javascript:yauzl` | imports
- `scripts/performance.mjs` -> `external:javascript:node:assert` | imports
- `scripts/performance.mjs` -> `external:javascript:node:fs` | calls
- `scripts/performance.mjs` -> `external:javascript:node:fs` | imports
- `scripts/performance.mjs` -> `external:javascript:node:path` | imports
- `scripts/performance.mjs` -> `external:javascript:node:perf_hooks` | imports
- `scripts/performance.mjs` -> `external:javascript:node:url` | calls
- `scripts/performance.mjs` -> `external:javascript:node:url` | imports
- `scripts/performance.mjs` -> `src/core/filename.ts` | calls
- `scripts/performance.mjs` -> `src/core/filename.ts` | imports
- `scripts/performance.mjs` -> `src/core/formatters.ts` | calls
- `scripts/performance.mjs` -> `src/core/formatters.ts` | imports
- `scripts/performance.mjs` -> `src/core/media.ts` | calls
- `scripts/performance.mjs` -> `src/core/media.ts` | imports
- `scripts/performance.mjs` -> `src/core/paths.ts` | calls
- `scripts/performance.mjs` -> `src/core/paths.ts` | imports
- `scripts/release-artifact.mjs` -> `external:javascript:node:assert` | imports
- `scripts/release-artifact.mjs` -> `external:javascript:node:child_process` | calls
- `scripts/release-artifact.mjs` -> `external:javascript:node:child_process` | imports
- `scripts/release-artifact.mjs` -> `external:javascript:node:crypto` | calls
- `scripts/release-artifact.mjs` -> `external:javascript:node:crypto` | imports
- `scripts/release-artifact.mjs` -> `external:javascript:node:fs` | calls
- `scripts/release-artifact.mjs` -> `external:javascript:node:fs` | imports
- `scripts/render-media.mjs` -> `external:javascript:node:path` | imports
- `scripts/render-media.mjs` -> `external:javascript:node:url` | calls
- `scripts/render-media.mjs` -> `external:javascript:node:url` | imports
- `scripts/render-media.mjs` -> `external:javascript:sharp` | calls
- Showing 50 of 116 edges; JSON contains every edge and its evidence.

## Unknown

- `package.json:1`: unresolved-local-import (./dist/node/extension.cjs)
- `scripts/build-web-tests.mjs:5`: object-member-call-not-resolved (path)
- `scripts/build-web-tests.mjs:5`: object-member-call-not-resolved (path)
- `scripts/build-web-tests.mjs:7`: object-member-call-not-resolved (path)
- `scripts/build-web-tests.mjs:12`: object-member-call-not-resolved (path)
- `scripts/check-media.mjs:7`: object-member-call-not-resolved (path)
- `scripts/check-media.mjs:7`: object-member-call-not-resolved (path)
- `scripts/check-media.mjs:8`: object-member-call-not-resolved (path)
- `scripts/check-media.mjs:9`: object-member-call-not-resolved (path)
- `scripts/check-media.mjs:11`: object-member-call-not-resolved (assert)
- `scripts/check-media.mjs:11`: object-member-call-not-resolved (path)
- `scripts/check-media.mjs:13`: object-member-call-not-resolved (path)

## Flows

- no source-backed call path from a recognized trigger

## Architecture changes

- Nodes: +3 / -0; edges: +10 / -19.
- Boundary changes: 0; new cycles: 0.

## Read next

- Use `status` before relying on this generation.
- Use `impact --changed` for possible impact and related test evidence.
- Use `diff --before <model> --after <model>` for architecture changes.
