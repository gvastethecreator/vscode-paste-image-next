import assert from "node:assert/strict";
import test from "node:test";
import {
  basenameUriPath,
  createReferencePath,
  dirnameUriPath,
  PathError,
  relativeUriPath,
  resolveDestinationPath,
} from "./paths.ts";

test("resolves document and workspace destination templates", () => {
  const input = {
    documentPath: "/project/docs/guide.html",
    workspacePath: "/project",
  };
  assert.equal(
    resolveDestinationPath({ ...input, template: "${documentDir}/assets" }),
    "/project/docs/assets",
  );
  assert.equal(
    resolveDestinationPath({ ...input, template: "${workspaceFolder}/media/${documentName}" }),
    "/project/media/guide",
  );
  assert.equal(
    resolveDestinationPath({ ...input, template: "images" }),
    "/project/docs/images",
  );
  assert.equal(
    resolveDestinationPath({
      documentPath: "/c:/Project/docs/guide.html",
      template: "${workspaceFolder}/media",
      workspacePath: "/C:/PROJECT",
    }),
    "/C:/PROJECT/media",
  );
});

test("keeps an outside-workspace document inside its own directory", () => {
  assert.equal(
    resolveDestinationPath({ documentPath: "/notes/page.html", template: "assets" }),
    "/notes/assets",
  );
});

test("rejects traversal, unsupported tokens, schemes, and reserved segments", () => {
  const input = { documentPath: "/project/docs/page.html", workspacePath: "/project" };
  for (const template of ["../outside", "/absolute", "${env}/assets", "file:assets", "${workspaceFolder}/NUL"]) {
    assert.throws(() => resolveDestinationPath({ ...input, template }), PathError);
  }
  assert.throws(
    () => resolveDestinationPath({ documentPath: "/notes/page.html", template: "${workspaceFolder}/assets" }),
    /needs a workspace folder/,
  );
});

test("creates encoded document-relative references", () => {
  assert.equal(
    createReferencePath(
      "/project/docs/page.html",
      "/project/docs/assets/Hero image (1).png",
      "documentRelative",
      "/project",
    ),
    "./assets/Hero%20image%20%281%29.png",
  );
  assert.equal(
    createReferencePath(
      "/project/docs/page.html",
      "/project/media/hero.png",
      "documentRelative",
      "/project",
    ),
    "../media/hero.png",
  );
});

test("creates workspace-relative references and rejects outside assets", () => {
  assert.equal(
    createReferencePath(
      "/project/docs/page.html",
      "/project/media/hero.png",
      "workspaceRelative",
      "/project",
    ),
    "/media/hero.png",
  );
  assert.throws(
    () => createReferencePath(
      "/project/docs/page.html",
      "/outside/hero.png",
      "workspaceRelative",
      "/project",
    ),
    PathError,
  );
});

test("handles root paths and relative path identity", () => {
  assert.equal(dirnameUriPath("/page.html"), "/");
  assert.equal(basenameUriPath("/project/docs/page.html"), "page.html");
  assert.equal(relativeUriPath("/project/docs", "/project/docs"), ".");
  assert.equal(relativeUriPath("/C:/project/docs", "/c:/project/media/image.png"), "../media/image.png");
  assert.equal(relativeUriPath("/C:/Project/Docs", "/c:/project/MEDIA/image.png"), "../MEDIA/image.png");
  assert.throws(() => relativeUriPath("/C:/project/docs", "/D:/media/image.png"), /different drives/);
});
