// When launched from VSCode/Claude Code, ELECTRON_RUN_AS_NODE may be set,
// which causes require("electron") to return the binary path string instead of
// Electron APIs. Self-restart without that variable — only in dev mode.
// In packaged apps __dirname always contains a "resources" segment; skip the
// guard there because the packaged .exe handles its own environment correctly.
const _path0 = require("path");
const _isPackaged = __dirname.split(_path0.sep).includes("resources");

if (process.env.ELECTRON_RUN_AS_NODE && !_isPackaged) {
  const { spawn } = require("child_process");
  const env = Object.assign({}, process.env);
  delete env.ELECTRON_RUN_AS_NODE;
  spawn(process.execPath, [_path0.join(__dirname, "..")], {
    env,
    stdio: "inherit",
    cwd: _path0.join(__dirname, ".."),
  }).on("close", (code) => process.exit(code ?? 0));
  return;
}

const { app, BrowserWindow, shell, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

const isDev = !app.isPackaged;
const PORT = isDev ? 3000 : 3001;

let devServer = null;

function waitForServer(retries = 120) {
  return new Promise((resolve, reject) => {
    const check = () => {
      // Use 127.0.0.1 explicitly — on Windows 11 "localhost" may resolve to
      // ::1 (IPv6) while the server binds only to 127.0.0.1 (IPv4).
      const req = http.get(`http://127.0.0.1:${PORT}`, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (--retries > 0) setTimeout(check, 500);
        else reject(new Error(`Chesskit server did not start on port ${PORT}`));
      });
      req.end();
    };
    check();
  });
}

// Returns the userData data dir, migrating data from legacy locations if needed.
function ensureDataDir() {
  const dataDir = path.join(app.getPath("userData"), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // Source dirs to migrate from (project root in dev, packaged standalone fallback)
  const sourceDirs = [
    path.join(__dirname, "..", "data"),
    path.join(process.resourcesPath || "", ".electron-standalone", "data"),
    path.join(process.resourcesPath || "", "electron-standalone", "data"),
  ];

  // JSON files: migrate if dest is missing OR is an empty "[]"
  const jsonFiles = ["games.json", "openings.json", "notes.json", "notes-images.json"];
  for (const file of jsonFiles) {
    const dest = path.join(dataDir, file);
    const destEmpty =
      !fs.existsSync(dest) ||
      fs.readFileSync(dest, "utf-8").trim() === "[]";
    if (!destEmpty) continue;

    let migrated = false;
    for (const srcDir of sourceDirs) {
      const src = path.join(srcDir, file);
      try {
        const content = fs.readFileSync(src, "utf-8").trim();
        if (content && content !== "[]") {
          fs.writeFileSync(dest, content, "utf-8");
          migrated = true;
          break;
        }
      } catch (_) { /* not found, skip */ }
    }
    if (!migrated && !fs.existsSync(dest)) {
      fs.writeFileSync(dest, "[]", "utf-8");
    }
  }

  // Notes images directory: copy if dest doesn't exist yet
  const destImagesDir = path.join(dataDir, "notes-images");
  if (!fs.existsSync(destImagesDir)) {
    for (const srcDir of sourceDirs) {
      const src = path.join(srcDir, "notes-images");
      if (fs.existsSync(src)) {
        try {
          fs.cpSync(src, destImagesDir, { recursive: true });
          break;
        } catch (_) { /* skip on error */ }
      }
    }
  }

  return dataDir;
}

function startDevServer() {
  const dataDir = ensureDataDir();
  const isWindows = process.platform === "win32";
  devServer = spawn("npm", ["run", "dev"], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    shell: isWindows,
    env: { ...process.env, DATA_DIR: dataDir },
  });
  devServer.on("error", (err) => console.error("Dev server error:", err));
}

function startProdServer() {
  const standaloneDir = path.join(process.resourcesPath, ".electron-standalone");

  if (!fs.existsSync(standaloneDir)) {
    throw new Error(
      `Standalone server not found at:\n${standaloneDir}\n\nRe-run "npm run electron-pack" to rebuild.`
    );
  }

  const dataDir = ensureDataDir();

  process.env.PORT = String(PORT);
  process.env.HOSTNAME = "127.0.0.1";
  process.env.DATA_DIR = dataDir;

  // Change cwd so Next.js standalone can find its assets
  process.chdir(standaloneDir);
  require(path.join(standaloneDir, "server.js"));
}

// ─────────────────────────── Auto-update wiring ───────────────────────────
//
// Checks the GitHub Releases feed (configured under "publish" in package.json)
// for a newer version on startup. When one is found, it downloads in the
// background and, once ready, asks the user via a dialog whether to install
// now (relaunches the app) or later (applies on next quit). All of this is
// no-op in dev mode — electron-updater bails out when app.isPackaged is false.

function setupAutoUpdate(getWindow) {
  if (isDev) return; // no updates during local dev

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("error", (err) => {
    console.error("[updater] error:", err?.message ?? err);
  });

  autoUpdater.on("update-available", (info) => {
    console.log(`[updater] update available: v${info?.version}`);
  });

  autoUpdater.on("update-not-available", () => {
    console.log("[updater] up to date");
  });

  autoUpdater.on("update-downloaded", async (info) => {
    const win = getWindow();
    const result = await dialog.showMessageBox(win, {
      type: "info",
      buttons: ["Restart now", "Later"],
      defaultId: 0,
      cancelId: 1,
      title: "Chesskit update ready",
      message: `Chesskit ${info?.version ?? ""} is ready to install.`,
      detail:
        "Choose 'Restart now' to apply the update immediately, or 'Later' to apply it the next time you quit Chesskit.",
    });
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  // Kick off the check shortly after launch so the window is already visible.
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error("[updater] checkForUpdates failed:", err?.message ?? err);
    });
  }, 3000);
}

function createWindow() {
  const iconPath = isDev
    ? path.join(__dirname, "..", "public", "favicon.png")
    : path.join(process.resourcesPath, "icon.png");

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    icon: iconPath,
    title: "Chesskit",
    backgroundColor: "#2b2b2b",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.setMenuBarVisibility(false);
  win.loadURL(`http://127.0.0.1:${PORT}`);

  // Show window once page is ready (avoids white flash)
  win.once("ready-to-show", () => win.show());

  // Open external links in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  return win;
}

app.whenReady().then(async () => {
  try {
    if (isDev) {
      startDevServer();
    } else {
      startProdServer();
    }

    await waitForServer();
    const mainWindow = createWindow();
    setupAutoUpdate(() => mainWindow);
  } catch (err) {
    dialog.showErrorBox("Chesskit failed to start", String(err?.message ?? err));
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (devServer) devServer.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (devServer) devServer.kill();
});
