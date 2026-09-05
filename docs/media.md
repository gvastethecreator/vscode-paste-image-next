# Media provenance

## Marketplace icon

The icon uses the product metaphor “an image entering a document.” It was designed for a 32 px extension list first, then exported at 256 px for the Marketplace.

- Concept source: OpenAI built-in image generation output `exec-f503e020-0fbd-4861-93ad-22de7e5828c4`, retained as `media/source/paste-image-next-imagegen-raw.png`; native-alpha extraction output `exec-292cfd2f-e49c-49ca-b4ac-79703fc554f3` produced the accepted cutout.
- Approved production raster: `media/source/paste-image-next-approved.png`, normalized to a thin transparent safety margin without redrawing the generated art.
- Package asset: `media/icon.png`, 256 by 256 RGBA.
- Palette: graphite, white, cool light gray, coral, orange, and violet; no France blue or emerald.
- Composition: the image card sits outside and in front of one document, while the orange arrow makes the paste direction readable at extension-list size.
- Finish: Tag Mate-style crisp vectorized semi-3D with shallow plane depth, controlled gradients, and compact vector shadows; no plastic, glow, glass, gloss, tile, or background.
- Alpha check: all four corner pixels are fully transparent; 32 px and 64 px exports were visually inspected.

The generated concept established the external-image/document silhouette. The approved raster preserves it directly; no SVG reinterpretation remains. SHA-256: raw `40506E24DB06EE81720F6CA9F5E7E7D144BC4A03AAADE2498995ED229ECA28D1`, approved `3C42C6ACB280E18D5DE5BE27E78A38DCEF0FF23998DA5A73DA3670652E508DBF`, production `EF1B66EEBD4E1CB7F957F9C9045F60B337DAD46E9315B4085F6259076F30E34E`.

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
