# Media provenance

## Marketplace icon

The icon uses the product metaphor “an image entering a document.” It was designed for a 32 px extension list first, then exported at 256 px for the Marketplace.

- Concept source: OpenAI built-in image generation, 2026-09-02, output id `exec-25014127-2f2c-4d3e-974b-526ccf204af1`.
- Approved production raster: `media/source/paste-image-next-approved.png`, locked from the user-approved cleanup of the generated concept.
- Package asset: `media/icon.png`, 256 by 256 RGBA.
- Palette: deep navy, clear blue, warm amber, restrained teal, and matte ivory.
- Finish: flat 2D with overlap depth only; no glow, glass, gloss, shine, neon, tile, or background.
- Alpha check: all four corner pixels are fully transparent; 32 px and 64 px exports were visually inspected.

The generated concept established the image/document silhouette. The approved raster preserves the cleaned flat result directly; no SVG reinterpretation remains.

## Marketplace preview

`media/preview.png` is not a mockup and was not image-generated.

- Source: Paste Image Next 0.1.0 installed in stable VS Code 1.136.1 on Windows, captured at runtime on 2026-09-03.
- Flow: a centered 960×720 crop of the synthetic illustration in `media/source/paste-image-next-preview-imagegen.png` was written to the Windows clipboard, then pasted with Ctrl+V into a real HTML editor.
- Result: the extension created `assets/dashboard-preview.png` and inserted `<img src="./assets/dashboard-preview.png" alt="Dashboard preview">`.
- Runtime proof: the created asset was opened beside the HTML file in the same stable VS Code session.
- Final asset: a tightly cropped RGBA image of Explorer and the two relevant editors, with a transparent perimeter and rounded transparent corners.

The screenshot shows the created asset in Explorer, the inserted HTML reference, and VS Code's real transparent-image preview.

### Synthetic clipboard fixture

- Provider: OpenAI built-in ImageGen.
- Generated: 2026-09-03.
- Output id: `exec-ba91b196-42fe-4c6d-be43-74006a45fb0d`.
- Source SHA-256: `8AD404525E1A621908E4BBAF04EF00E80CA9627087E14AEB44BBB6E300C1886B`.
- Direction: a restrained soft-3D Atlas developer dashboard illustration with matte navy surfaces and balanced cobalt, violet, amber, coral, and teal accents; no text, logo, watermark, glass, glow, or extreme saturation.

The generated image is sample content only. Every VS Code surface around it comes from the installed extension's real paste flow.
