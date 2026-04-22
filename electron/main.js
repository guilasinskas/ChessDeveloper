const { app, BrowserWindow, shell } = require("electron");
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
      const req = http.get(`http://localhost:${PORT}`, (res) => {
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

// Returns the userData data dir, migrating games from legacy locations if needed.
function ensureDataDir() {
  const dataDir = path.join(app.getPath("userData"), "data");
  const gamesJson = path.join(dataDir, "games.json");

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  if (!fs.existsSync(gamesJson) || fs.readFileSync(gamesJson, "utf-8").trim() === "[]") {
    // Migration candidates: project root data dir (dev) or standalone data dir (prod)
    const candidates = [
      path.join(__dirname, "..", "data", "games.json"),
      path.join(process.resourcesPath || "", "electron-standalone", "data", "games.json"),
    ];
    let migrated = false;
    for (const src of candidates) {
      try {
        const content = fs.readFileSync(src, "utf-8").trim();
        if (content && content !== "[]") {
          fs.writeFileSync(gamesJson, content, "utf-8");
          migrated = true;
          break;
        }
      } catch (_) { /* not found, skip */ }
    }
    if (!migrated && !fs.existsSync(gamesJson)) {
      fs.writeFileSync(gamesJson, "[]", "utf-8");
    }
  }

  return dataDir;
}

function startDevServer() {
  const dataDir = ensureDataDir();
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  devServer = spawn(npmCmd, ["run", "dev"], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    shell: false,
    env: { ...process.env, DATA_DIR: dataDir },
  });
  devServer.on("error", (err) => console.error("Dev server error:", err));
}

function startProdServer() {
  const standaloneDir = path.join(process.resourcesPath, "electron-standalone");
  const dataDir = ensureDataDir();

  process.env.PORT = String(PORT);
  process.env.HOSTNAME = "127.0.0.1";
  process.env.DATA_DIR = dataDir;

  // Change cwd so Next.js standalone can find its assets
  process.chdir(standaloneDir);
  require(path.join(standaloneDir, "server.js"));
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
  win.loadURL(`http://localhost:${PORT}`);

  // Show window once page is ready (avoids white flash)
  win.once("ready-to-show", () => win.show());

  // Open external links in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(async () => {
  if (isDev) {
    startDevServer();
  } else {
    startProdServer();
  }

  await waitForServer();
  createWindow();

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
