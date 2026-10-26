import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFilename,
  FilenameError,
  sanitizeStem,
  validateRequestedStem,
} from "./filename.ts";

const context = {
  date: "2026-09-02",
  documentName: "Product Page.html",
  requestedName: "Hero image",
  time: "142305",
};

test("expands approved filename tokens", () => {
  assert.equal(
    buildFilename("${documentName}-${date}-${time}", context, ".png", 1),
    "Product-Page-2026-09-02-142305.png",
  );
  assert.equal(buildFilename("${name}", context, ".jpg", 1), "Hero-image.jpg");
});

test("allocates deterministic collision names", () => {
  assert.equal(buildFilename("image", context, ".png", 1), "image.png");
  assert.equal(buildFilename("image", context, ".png", 2), "image-2.png");
  assert.equal(buildFilename("image-${counter}", context, ".png", 3), "image-3.png");
  const maximumStem = "x".repeat(96);
  const second = buildFilename(maximumStem, context, ".png", 2);
  assert.equal(second, `${"x".repeat(94)}-2.png`);
  assert.notEqual(second, buildFilename(maximumStem, context, ".png", 1));
  assert.match(buildFilename(`${maximumStem}-${"${counter}"}`, context, ".png", 2), /-2\.png$/);
});

test("sanitizes unsafe and Windows-reserved stems", () => {
  assert.equal(sanitizeStem("  hero: image?.png  "), "hero-image-.png");
  assert.equal(sanitizeStem("CON"), "image-CON");
  assert.equal(sanitizeStem(".."), "image");
  assert.equal(sanitizeStem("café 画面"), "café-画面");
});

test("normalizes a user-supplied image extension", () => {
  assert.equal(buildFilename("${name}", { ...context, requestedName: "hero.JPEG" }, ".png", 1), "hero.png");
});

test("rejects invalid templates and attempts", () => {
  assert.throws(() => buildFilename("", context, ".png", 1), FilenameError);
  assert.throws(() => buildFilename("folder/image", context, ".png", 1), FilenameError);
  assert.throws(() => buildFilename("${env}", context, ".png", 1), /Unsupported filename token/);
  assert.throws(() => buildFilename("${date", context, ".png", 1), /incomplete token/);
  assert.throws(() => buildFilename("image", context, ".png", 0), FilenameError);
});

test("validates explicit user names without silently accepting paths", () => {
  assert.equal(validateRequestedStem("hero-image"), undefined);
  assert.match(validateRequestedStem("../hero") ?? "", /path separators/);
  assert.match(validateRequestedStem("NUL") ?? "", /reserved/);
  assert.match(validateRequestedStem("image. ") ?? "", /dot or space/);
  assert.match(validateRequestedStem(" ") ?? "", /Enter/);
});
