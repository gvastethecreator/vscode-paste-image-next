import assert from "node:assert/strict";
import test from "node:test";
import {
  automaticFormatForLanguage,
  explicitFormatForLanguage,
  formatReference,
  formatSupportsAltText,
  pasteTitle,
} from "./formatters.ts";

test("selects automatic formats without intercepting Markdown", () => {
  assert.equal(automaticFormatForLanguage("html", false), "html");
  assert.equal(automaticFormatForLanguage("scss", false), "css");
  assert.equal(automaticFormatForLanguage("mdx", false), "mdx");
  assert.equal(automaticFormatForLanguage("markdown", false), undefined);
  assert.equal(automaticFormatForLanguage("markdown", true), "markdown");
  assert.equal(automaticFormatForLanguage("typescript", false), undefined);
});

test("uses path-only output for explicit unknown-language paste", () => {
  assert.equal(explicitFormatForLanguage("typescript"), "path");
  assert.equal(explicitFormatForLanguage("unknown"), "path");
});

test("formats HTML, CSS, MDX, Markdown, and path references", () => {
  assert.equal(
    formatReference("html", "./assets/a&amp;b.png", "A \"quote\" & more"),
    '<img src="./assets/a&amp;amp;b.png" alt="A &quot;quote&quot; &amp; more">',
  );
  assert.equal(formatReference("css", './assets/a"b.png', ""), 'url("./assets/a\\"b.png")');
  assert.equal(
    formatReference("mdx", "./assets/a.png", "Preview"),
    '<img src="./assets/a.png" alt="Preview" />',
  );
  assert.equal(formatReference("markdown", "./assets/a.png", "A [shot]"), "![A \\[shot\\]](./assets/a.png)");
  assert.equal(formatReference("path", "./assets/a.png", "ignored"), "./assets/a.png");
});

test("describes edit kinds and alt-text support", () => {
  assert.equal(pasteTitle("html", false), "Paste image as HTML asset");
  assert.equal(pasteTitle("path", true), "Paste image as path asset with details");
  assert.equal(formatSupportsAltText("mdx"), true);
  assert.equal(formatSupportsAltText("css"), false);
});
