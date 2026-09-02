# Development

Package manager: pnpm 12. Do not switch to npm or yarn.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm install --frozen-lockfile` | Install the locked toolchain |
| `pnpm test` | Run pure TypeScript unit tests |
| `pnpm run check-types` | Check strict TypeScript types |
| `pnpm run compile` | Build development Node and browser bundles |
| `pnpm run package` | Build minified production bundles |
| `pnpm run test:performance` | Check hot-path and bundle budgets |
| `pnpm run test:integration` | Run the desktop Extension Host suite |
| `pnpm run test:web` | Run the browser host and writable virtual-workspace suite |
| `pnpm run quality` | Run unit, type, build, and performance gates |
| `pnpm run vsix` | Build `paste-image-next.vsix` |
| `pnpm run inspect:vsix` | Check package contents, manifest, assets, and runtime surfaces |
| `pnpm run test:vsix` | Install the VSIX into a clean profile and run the integration suite |

## Extension Host

Press F5 with **Run Extension**. The launch configuration builds first and opens `test-workspace/`.

The production entry points are:

- `dist/node/extension.cjs` for local and remote Node hosts;
- `dist/web/extension.cjs` for browser hosts.

Core modules under `src/core/` must remain free of VS Code and Node runtime imports. The provider may use only stable VS Code APIs. Do not add clipboard polling, a platform helper, raw filesystem access, or a settings webview.

## Test intent

Unit tests own deterministic transformation rules. The desktop host owns native edit transactions and failure paths. The browser host owns web bundle activation and a writable non-file filesystem. The VSIX test owns packaged install and activation.

Synthetic DataTransfer tests do not prove operating-system clipboard metadata. Before publication, run a packaged real-clipboard smoke test on every environment advertised in the listing.
