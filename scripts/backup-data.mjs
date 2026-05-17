#!/usr/bin/env node
// Snapshot the local data/ directory (games, openings, notes, etc.) into
// data-backups/data-YYYY-MM-DD-HHMMSS/. Run this before doing anything
// destructive (bulk delete, folder wipes, schema migrations) so you can
// always roll back by copying the snapshot back to data/.
//
// Usage:
//   npm run backup-data
//   npm run backup-data -- /custom/source/path
//
// Env:
//   WHITE_TO_MOVE_DATA_DIR or CHESSKIT_DATA_DIR  honored as the source
//   BACKUP_DIR                                   destination root (default: data-backups/)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath strips the leading slash on Windows that path.dirname(url.pathname)
// would otherwise leave in place (producing C:\C:\...).
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const argSource = process.argv[2];
const source =
  argSource ||
  process.env.WHITE_TO_MOVE_DATA_DIR ||
  process.env.CHESSKIT_DATA_DIR ||
  path.join(projectRoot, "data");

const destRoot = process.env.BACKUP_DIR || path.join(projectRoot, "data-backups");

if (!fs.existsSync(source)) {
  console.error(`[backup] source not found: ${source}`);
  process.exit(1);
}

const stamp = new Date()
  .toISOString()
  .replace(/[:T]/g, "-")
  .replace(/\.\d+Z$/, "");
const dest = path.join(destRoot, `data-${stamp}`);

fs.mkdirSync(destRoot, { recursive: true });

const start = Date.now();
let fileCount = 0;
let byteCount = 0;

function copyRecursive(srcDir, dstDir) {
  fs.mkdirSync(dstDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const dstPath = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, dstPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, dstPath);
      const stat = fs.statSync(dstPath);
      fileCount++;
      byteCount += stat.size;
      if (fileCount % 5000 === 0) {
        process.stdout.write(`  copied ${fileCount.toLocaleString()} files…\r`);
      }
    }
    // Skip symlinks / sockets / etc. — none expected in data/, ignore silently.
  }
}

console.log(`[backup] source: ${source}`);
console.log(`[backup] dest:   ${dest}`);

copyRecursive(source, dest);

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
const sizeMB = (byteCount / 1024 / 1024).toFixed(1);
console.log(
  `\n[backup] done in ${elapsed}s — ${fileCount.toLocaleString()} files, ${sizeMB} MB`
);
console.log(`[backup] restore with:\n  rm -rf data && cp -r "${dest}" data`);
