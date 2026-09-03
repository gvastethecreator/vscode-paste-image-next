import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "media", "source", "paste-image-next-approved.png");
await sharp(source).ensureAlpha().resize(256, 256, { fit: "contain" }).png().toFile(path.join(root, "media", "icon.png"));
console.log("Rendered Paste Image Next directly from the approved raster source.");
