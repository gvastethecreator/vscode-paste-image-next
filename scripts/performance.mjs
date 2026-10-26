import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { buildFilename } from "../src/core/filename.ts";
import { formatReference } from "../src/core/formatters.ts";
import { validateImage } from "../src/core/media.ts";
import { createReferencePath, resolveDestinationPath } from "../src/core/paths.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const largeImage = new Uint8Array(50 * 1024 * 1024);
largeImage.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const mediaStarted = performance.now();
validateImage(largeImage, "image/png", "capture.png", largeImage.byteLength);
const mediaMs = performance.now() - mediaStarted;
assert.ok(mediaMs < 20, `Media validation exceeded 20 ms: ${mediaMs.toFixed(2)} ms.`);

const iterations = 10_000;
const coreStarted = performance.now();
for (let index = 1; index <= iterations; index += 1) {
  const destination = resolveDestinationPath({
    documentPath: "/workspace/docs/page.html",
    template: "${workspaceFolder}/media/${documentName}",
    workspacePath: "/workspace",
  });
  const filename = buildFilename(
    "${documentName}-${date}-${time}",
    { date: "2026-09-02", documentName: "page.html", time: "120000" },
    ".png",
    index,
  );
  const reference = createReferencePath(
    "/workspace/docs/page.html",
    `${destination}/${filename}`,
    "documentRelative",
    "/workspace",
  );
  formatReference("html", reference, "");
}
const coreMs = performance.now() - coreStarted;
const averageMs = coreMs / iterations;
assert.ok(averageMs < 0.25, `Core paste planning averaged ${averageMs.toFixed(3)} ms.`);

for (const output of ["dist/node/extension.cjs", "dist/web/extension.cjs"]) {
  const bytes = (await stat(path.join(root, output))).size;
  assert.ok(bytes < 300 * 1024, `${output} exceeds the 300 KiB bundle budget.`);
}

console.log(`Performance passed: media ${mediaMs.toFixed(2)} ms; core ${averageMs.toFixed(3)} ms/op.`);
