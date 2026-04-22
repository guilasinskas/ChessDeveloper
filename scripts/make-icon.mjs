/**
 * Builds public/favicon.ico from public/favicon.png (512x512).
 * Embeds sizes 16, 32, 48, 64, 128, 256 as PNG-inside-ICO.
 * Run: node scripts/make-icon.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src  = join(root, "public", "favicon.png");
const dst  = join(root, "public", "favicon.ico");

const SIZES = [16, 32, 48, 64, 128, 256];

// ── 1. Render each size as a PNG Buffer ──────────────────────────────────────
console.log("▶ Resizing frames…");
const pngBuffers = await Promise.all(
  SIZES.map((s) =>
    sharp(src).resize(s, s, { fit: "cover" }).png().toBuffer()
  )
);
SIZES.forEach((s, i) =>
  console.log(`  ${s}×${s}  → ${pngBuffers[i].length} bytes`)
);

// ── 2. Assemble ICO binary ───────────────────────────────────────────────────
// ICO layout:
//   ICONDIR   (6 bytes)
//   ICONDIRENTRY × N  (16 bytes each)
//   <PNG data concatenated>
const N = SIZES.length;
const headerSize = 6 + N * 16;

let offset = headerSize;
const entries = pngBuffers.map((buf, i) => {
  const e = {
    // ICO spec: width/height byte = 0 means 256
    w: SIZES[i] === 256 ? 0 : SIZES[i],
    h: SIZES[i] === 256 ? 0 : SIZES[i],
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
  ico.writeUInt8(e.w, pos);           pos += 1;
  ico.writeUInt8(e.h, pos);           pos += 1;
  ico.writeUInt8(0,   pos);           pos += 1; // colorCount (0 = true-color)
  ico.writeUInt8(0,   pos);           pos += 1; // reserved
  ico.writeUInt16LE(1,  pos);         pos += 2; // planes
  ico.writeUInt16LE(32, pos);         pos += 2; // bitCount
  ico.writeUInt32LE(e.byteCount, pos); pos += 4;
  ico.writeUInt32LE(e.offset,    pos); pos += 4;
}

// PNG data
for (const buf of pngBuffers) {
  buf.copy(ico, pos);
  pos += buf.length;
}

writeFileSync(dst, ico);
console.log(`\n✓ ${dst}`);
console.log(`  ${(ico.length / 1024).toFixed(1)} KB  |  sizes: ${SIZES.join(", ")}`);
