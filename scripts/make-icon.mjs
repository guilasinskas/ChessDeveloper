/**
 * Generates every app-icon file from the single source `public/favicon.png`.
 *
 * Outputs:
 *   public/favicon.ico                    — multi-resolution Windows icon
 *   public/favicon-16x16.png              — browser tab (small)
 *   public/favicon-32x32.png              — browser tab (large)
 *   public/apple-touch-icon.png           — iOS home-screen icon (180x180)
 *   public/android-chrome-192x192.png     — PWA / Android (referenced in webmanifest)
 *   public/android-chrome-512x512.png     — PWA / Android (referenced in webmanifest)
 *
 * The source should be a square PNG, ideally ≥ 1024x1024 so every output
 * downscale is sharp. Use a transparent background or a solid color — the
 * script preserves the source exactly via `fit: "cover"`.
 *
 * Run: node scripts/make-icon.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "public", "favicon.png");

// ── 1. Regenerate every PNG variant ──────────────────────────────────────────
const PNG_OUTPUTS = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
];

console.log("▶ Generating PNG icons from", src);
for (const { name, size } of PNG_OUTPUTS) {
  const out = join(root, "public", name);
  await sharp(src).resize(size, size, { fit: "cover" }).png().toFile(out);
  console.log(`  ${size.toString().padStart(3)}×${size}  → ${name}`);
}

// ── 2. Build the multi-resolution .ico ───────────────────────────────────────
const ICO_SIZES = [16, 32, 48, 64, 128, 256];
console.log("\n▶ Building favicon.ico");
const pngBuffers = await Promise.all(
  ICO_SIZES.map((s) =>
    sharp(src).resize(s, s, { fit: "cover" }).png().toBuffer()
  )
);
ICO_SIZES.forEach((s, i) =>
  console.log(`  ${s}×${s}  → ${pngBuffers[i].length} bytes`)
);

// ICO layout:
//   ICONDIR   (6 bytes)
//   ICONDIRENTRY × N  (16 bytes each)
//   <PNG data concatenated>
const N = ICO_SIZES.length;
const headerSize = 6 + N * 16;

let offset = headerSize;
const entries = pngBuffers.map((buf, i) => {
  const e = {
    // ICO spec: width/height byte = 0 means 256
    w: ICO_SIZES[i] === 256 ? 0 : ICO_SIZES[i],
    h: ICO_SIZES[i] === 256 ? 0 : ICO_SIZES[i],
    byteCount: buf.length,
    offset,
  };
  offset += buf.length;
  return e;
});

const ico = Buffer.alloc(offset);
let pos = 0;

// ICONDIR
ico.writeUInt16LE(0, pos); pos += 2; // reserved
ico.writeUInt16LE(1, pos); pos += 2; // type = 1 (icon)
ico.writeUInt16LE(N, pos); pos += 2;

// ICONDIRENTRYs
for (const e of entries) {
  ico.writeUInt8(e.w, pos);            pos += 1;
  ico.writeUInt8(e.h, pos);            pos += 1;
  ico.writeUInt8(0,   pos);            pos += 1; // colorCount (0 = true-color)
  ico.writeUInt8(0,   pos);            pos += 1; // reserved
  ico.writeUInt16LE(1,  pos);          pos += 2; // planes
  ico.writeUInt16LE(32, pos);          pos += 2; // bitCount
  ico.writeUInt32LE(e.byteCount, pos); pos += 4;
  ico.writeUInt32LE(e.offset,    pos); pos += 4;
}

// PNG data
for (const buf of pngBuffers) {
  buf.copy(ico, pos);
  pos += buf.length;
}

const icoOut = join(root, "public", "favicon.ico");
writeFileSync(icoOut, ico);
console.log(
  `\n✓ favicon.ico  (${(ico.length / 1024).toFixed(1)} KB · sizes: ${ICO_SIZES.join(", ")})`
);
console.log("\n✓ All icons regenerated. Rebuild the installer to bundle them.");
