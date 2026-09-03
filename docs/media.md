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

- Source: VS Code 1.136 Extension Development Host on Windows, captured at runtime on 2026-09-02.
- Flow: a known transparent PNG was written to the Windows clipboard, then pasted with Ctrl+V into a real HTML editor.
- Result: the extension created `assets/pasted-preview.png` and inserted `<img src="./assets/pasted-preview.png" alt="">`.
- Integrity: source and pasted files had the same SHA-256 hash, `427F94C92F9C8E14E77F7B83C92B7258D8B1F783D379DC0343971A304C7D8A25`.
- Runtime errors: none captured from the workbench renderer.
- Final asset: 1200 by 800 RGBA, with a 20 px transparent perimeter and rounded transparent corners.

The screenshot shows the created asset in Explorer, the inserted HTML reference, and VS Code's real transparent-image preview.
