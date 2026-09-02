import assert from "node:assert/strict";
import test from "node:test";
import {
  isPotentialImage,
  MediaError,
  validateImage,
} from "./media.ts";

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]);

test("recognizes supported MIME and file candidates", () => {
  assert.equal(isPotentialImage("IMAGE/PNG; charset=binary", "clipboard"), true);
  assert.equal(isPotentialImage("files", "photo.JPEG"), true);
  assert.equal(isPotentialImage("application/octet-stream", "photo.png"), true);
  assert.equal(isPotentialImage("files", "archive..PNG"), true);
  assert.equal(isPotentialImage("files", "vector.svg"), false);
  assert.equal(isPotentialImage("image/gif", "image.gif"), false);
  assert.equal(isPotentialImage("image/gif", "misnamed.png"), false);
});

test("validates PNG bytes and normalizes the extension", () => {
  assert.deepEqual(validateImage(png, "image/png", "clipboard", 32), {
    extension: ".png",
    mime: "image/png",
  });
});

test("validates JPEG bytes and preserves a safe jpeg extension", () => {
  assert.deepEqual(validateImage(jpeg, "image/jpeg", "photo.jpeg", 32), {
    extension: ".jpeg",
    mime: "image/jpeg",
  });
  assert.deepEqual(validateImage(jpeg, "image/jpg", "photo.bin", 32), {
    extension: ".jpg",
    mime: "image/jpeg",
  });
});

test("detects media from a file entry without a declared MIME", () => {
  assert.deepEqual(validateImage(png, undefined, "capture.png", 32), {
    extension: ".png",
    mime: "image/png",
  });
});

test("rejects empty, oversized, unsupported, and mismatched data", () => {
  assert.throws(
    () => validateImage(new Uint8Array(), "image/png", "image.png", 32),
    (error: unknown) => error instanceof MediaError && error.code === "empty",
  );
  assert.throws(
    () => validateImage(png, "image/png", "image.png", 7),
    (error: unknown) => error instanceof MediaError && error.code === "too-large",
  );
  assert.throws(
    () => validateImage(Uint8Array.of(1, 2, 3, 4), "image/png", "image.png", 32),
    (error: unknown) => error instanceof MediaError && error.code === "unsupported",
  );
  assert.throws(
    () => validateImage(png, "image/jpeg", "image.jpg", 32),
    (error: unknown) => error instanceof MediaError && error.code === "mime-mismatch",
  );
  assert.throws(
    () => validateImage(png, "image/png", "image.jpeg", 32),
    (error: unknown) => error instanceof MediaError && error.code === "mime-mismatch",
  );
  assert.throws(
    () => validateImage(jpeg, undefined, "image.png", 32),
    (error: unknown) => error instanceof MediaError && error.code === "mime-mismatch",
  );
});
