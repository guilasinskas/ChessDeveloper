/**
 * Prepares the Next.js standalone build for Electron packaging.
 * Resolves symlinks so electron-packager can copy without needing Developer Mode.
 * Run: node scripts/electron-build.mjs
 */
import { execSync } from "child_process";
import { cpSync, existsSync, renameSync, rmSync } from "fs";
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

// Remove directories that don't belong in the standalone bundle.
// Next.js file tracing can sweep in project-root dirs (e.g. data/, dist-electron/)
// when API routes reference DATA_DIR or other paths at build time.
const dirsToClean = [
  "data", "dist-electron", ".electron-standalone",
  ".git", "cdk", "cdk.out", "scripts", "assets", "docker",
];
for (const dir of dirsToClean) {
  const p = join(outDir, dir);
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
    console.log(`▶ Removed stray dir from standalone: ${dir}`);
  }
}

// Rename node_modules → _server_modules. electron-builder's extraResources
// copy applies file-level filters that silently drop nested `node_modules/`
// directories on the assumption they belong to the root project (deduped
// against the asar). Renaming side-steps that detection so the Next.js
// runtime deps actually make it into the packaged app. main.js sets
// NODE_PATH to this folder before `require`-ing server.js.
const standaloneNodeModules = join(outDir, "node_modules");
const standaloneRenamed = join(outDir, "_server_modules");
if (existsSync(standaloneNodeModules)) {
  if (existsSync(standaloneRenamed)) {
    rmSync(standaloneRenamed, { recursive: true, force: true });
  }
  renameSync(standaloneNodeModules, standaloneRenamed);
  console.log("▶ Renamed standalone/node_modules → _server_modules");
}

console.log("✓ Build ready at .electron-standalone/  →  run: npm run electron-pack");
