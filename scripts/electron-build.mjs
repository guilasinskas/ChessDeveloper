/**
 * Prepares the Next.js standalone build for Electron packaging.
 * Resolves symlinks so electron-packager can copy without needing Developer Mode.
 * Run: node scripts/electron-build.mjs
 */
import { execSync } from "child_process";
import { cpSync, existsSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const standaloneDir   = join(root, ".next", "standalone");
const outDir          = join(root, ".electron-standalone"); // symlink-free copy

console.log("▶ Building Next.js (standalone mode)...");
execSync("npx cross-env ELECTRON_BUILD=1 next build", {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env },
});

if (!existsSync(standaloneDir)) {
  console.error("✗ .next/standalone not found. Did the build succeed?");
  process.exit(1);
}

// Remove previous symlink-free copy
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });

console.log("▶ Copying standalone (dereferencing symlinks)...");
// dereference: true → follows symlinks and copies the actual files
cpSync(standaloneDir, outDir, { recursive: true, dereference: true });

console.log("▶ Copying static assets...");
cpSync(join(root, ".next", "static"), join(outDir, ".next", "static"), {
  recursive: true,
  dereference: true,
});
cpSync(join(root, "public"), join(outDir, "public"), {
  recursive: true,
  dereference: true,
});

console.log("✓ Build ready at .electron-standalone/  →  run: npm run electron-pack");
