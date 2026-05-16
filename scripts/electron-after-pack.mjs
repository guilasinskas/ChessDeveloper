/**
 * electron-builder afterPack hook.
 *
 * Renames `_server_modules` → `node_modules` inside the packaged
 * `resources/.electron-standalone/` folder so the Next.js standalone
 * server can resolve `require('next')` via standard Node.js resolution
 * — no runtime junctions or NODE_PATH dance needed.
 *
 * Why the rename exists in the first place:
 *   scripts/electron-build.mjs renames `.next/standalone/node_modules`
 *   to `_server_modules` because electron-builder's extraResources copy
 *   silently strips nested `node_modules/` directories. Renaming
 *   side-steps that filter. Here we put the name back AFTER the copy.
 *
 * Doing it here (instead of in main.js at startup) means the rename
 * happens while the installer/dir output is still writable. Once
 * NSIS drops the bundle into `C:\Program Files\White to Move\`, that dir
 * is read-only for non-admin processes and any runtime rename fails.
 */
import { existsSync, renameSync, rmSync } from "fs";
import { join } from "path";

export default async function afterPack(context) {
  const standaloneDir = join(
    context.appOutDir,
    "resources",
    ".electron-standalone"
  );
  const serverModules = join(standaloneDir, "_server_modules");
  const nodeModules = join(standaloneDir, "node_modules");

  if (!existsSync(serverModules)) {
    console.log(
      `[afterPack] _server_modules not found at ${serverModules} — skipping`
    );
    return;
  }

  if (existsSync(nodeModules)) {
    rmSync(nodeModules, { recursive: true, force: true });
  }
  renameSync(serverModules, nodeModules);
  console.log(
    "[afterPack] renamed packaged _server_modules → node_modules"
  );
}
