export type ReferenceFormat = "css" | "html" | "markdown" | "mdx" | "path";

export function automaticFormatForLanguage(
  languageId: string,
  markdownEnabled: boolean,
): ReferenceFormat | undefined {
  if (languageId === "html") return "html";
  if (languageId === "css" || languageId === "scss" || languageId === "less") return "css";
  if (languageId === "mdx") return "mdx";
  if (languageId === "markdown" && markdownEnabled) return "markdown";
  return undefined;
}

export function explicitFormatForLanguage(languageId: string): ReferenceFormat {
  if (languageId === "html") return "html";
  if (languageId === "css" || languageId === "scss" || languageId === "less") return "css";
  if (languageId === "mdx") return "mdx";
  if (languageId === "markdown") return "markdown";
  return "path";
}

export function formatReference(
  format: ReferenceFormat,
  referencePath: string,
  altText: string,
): string {
  switch (format) {
    case "html":
      return `<img src="${escapeHtmlAttribute(referencePath)}" alt="${escapeHtmlAttribute(altText)}">`;
    case "css":
      return `url("${escapeCssString(referencePath)}")`;
    case "mdx":
      return `<img src="${escapeHtmlAttribute(referencePath)}" alt="${escapeHtmlAttribute(altText)}" />`;
    case "markdown":
      return `![${escapeMarkdownAlt(altText)}](${referencePath})`;
    case "path":
      return referencePath;
  }
}

export function pasteTitle(format: ReferenceFormat, details: boolean): string {
  const label = format === "css"
    ? "CSS"
    : format === "html"
      ? "HTML"
      : format === "mdx"
        ? "MDX"
        : format === "markdown"
          ? "Markdown"
          : "path";
  return details
    ? `Paste image as ${label} asset with details`
    : `Paste image as ${label} asset`;
}

export function formatSupportsAltText(format: ReferenceFormat): boolean {
  return format === "html" || format === "markdown" || format === "mdx";
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeCssString(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\"", "\\\"")
    .replaceAll("\n", "\\a ")
    .replaceAll("\r", "\\d ")
    .replaceAll("\f", "\\c ");
}

function escapeMarkdownAlt(value: string): string {
  return value.replace(/[\\[\]]/g, "\\$&");
}
