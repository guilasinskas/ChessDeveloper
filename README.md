<div align="center">

# Chess Developer

**A personal chess workbench — play, analyze, study openings, and keep notes, all running locally on your machine.**

Powered by **Stockfish**, built on **Next.js + Electron**, with everything stored on your own disk.

<sub>Node ≥ 22.11 · Windows-first · Electron desktop build</sub>

</div>

---

![Alt Text](marketing.gif)

## What's inside

- **Analysis** — load a PGN (paste, file, Lichess URL, Chess.com link) and walk the moves with Stockfish evaluations, classifications (best/great/blunder/…), board arrows from `[%cal …]` annotations, and `[%clk]` clock markers inline with the moves
- **Play vs Stockfish** — pick an Elo and a time control (Bullet → Rapid 15+10), with two live clocks, increments, and timeout detection
- **Database** — local game library; everything you load is saved to a JSON file under your user data folder
- **Openings** — build repertoires move-by-move on a tree, with comments, NAGs, variations, mainline promotion, and a training mode that drills you on your own lines
- **Stats** — slice your games by opening (real variant names, not ECO codes), filter by color, hover for a mini board, drill into the move tree to see win-rates jogada-a-jogada, and load games directly from your Chess.com username
- **Notes** — searchable notes hub with tags and inline image references

All data lives locally. Nothing is uploaded anywhere.

---

## Quick start — just use the app

If you don't want to mess with Node and source code, grab the executable:

1. Run the installer (`Chesskit Setup *.exe`) **or** unzip the portable folder
2. Launch **Chesskit** from the Start Menu / desktop shortcut (or run `Chesskit.exe` from the unzipped folder)

That's it. The first launch creates a data folder at:

```
%APPDATA%\Chesskit\data\
```

Your games (`games.json`), repertoires (`openings.json`), notes (`notes.json`), and any uploaded images live there. Back up that folder if you care about your data — it's not synced anywhere.

---

## Running from source

For development or to build your own binary.

### Prerequisites

- Node.js **≥ 22.11**
- Windows 10/11 (the build pipeline targets `win32-x64`; other platforms work in dev mode)

### Install

```powershell
npm install
```

### Dev — Next.js only (browser)

```powershell
npm run dev
```

Opens at `http://localhost:3000`. Data is read from `./data/` in the project root in this mode.

### Dev — full Electron shell

```powershell
npm run electron
```

Spawns the Next.js dev server and wraps it in an Electron window. Hot reload works.

### Lint & type-check

```powershell
npm run lint
```

---

## Building a Windows executable

Two flavors, pick whichever you prefer.

### Portable (folder)

```powershell
npm run electron-pack
```

Produces a self-contained, no-install folder you can zip and copy anywhere:

```
dist-electron\Chesskit-win32-x64\Chesskit.exe
```

Double-click `Chesskit.exe` to launch — no installation needed.

### Installer (.exe)

```powershell
npm run electron-installer
```

Produces a real NSIS installer with desktop + Start Menu shortcuts:

```
dist-electron\Chesskit Setup <version>.exe
```

Both flavors bundle the Next.js standalone server, Stockfish WASM binaries, and all assets into a single artifact.

---

## Where your data goes

| Mode | Location |
|------|----------|
| `npm run dev` (browser) | `./data/` in the project root |
| `npm run electron` (dev shell) | `%APPDATA%\Chesskit\data\` |
| Packaged app | `%APPDATA%\Chesskit\data\` |

If you've been running `npm run dev` and want your data to follow you into the packaged app, the Electron entrypoint will migrate `games.json`, `openings.json`, `notes.json`, `notes-images.json` and the `notes-images/` folder on first launch — but only when the destination is missing or empty. To force a re-migration, delete the relevant file in `%APPDATA%\Chesskit\data\` first.

---

## Project layout

```
src/
  components/   reusable UI primitives (Board, NavLink, …)
  hooks/        engine, store, queries
  lib/          chess + PGN logic, analysis tree, Chess.com / Lichess clients
  pages/        Next.js routes — / · /play · /database · /openings · /notes · /stats
    api/        local JSON-backed API (games, openings, notes, images)
  sections/     page-level compositions (analysis panel, play board, …)
  types/        shared TypeScript types
  constants/    palette, engine config, navigation
electron/
  main.js       Electron entrypoint — runs Next.js standalone in prod
  preload.js
scripts/
  electron-build.mjs   builds .next/standalone → .electron-standalone
  make-icon.mjs        generates favicons from a source image
public/         Stockfish WASM, piece sets, sounds, icons
data/           local JSON store (gitignored)
```

---

## Stack

- [**Next.js**](https://nextjs.org/) (Pages Router) + [**React 19**](https://react.dev) + **TypeScript**
- [**Material UI**](https://mui.com/material-ui/) — components & theming
- [**Jotai**](https://jotai.org/) — atomic state
- [**TanStack Query**](https://tanstack.com/query) — async data
- [**chess.js**](https://github.com/jhlywa/chess.js) + [**react-chessboard**](https://github.com/Clariity/react-chessboard) — chess rules & rendering
- [**Stockfish (WASM)**](https://github.com/lichess-org/stockfish.wasm) — engine
- [**Electron**](https://www.electronjs.org/) + [**electron-packager**](https://github.com/electron/packager) / [**electron-builder**](https://www.electron.build/) — desktop shell & installer

---

## Troubleshooting

**`npm run electron` fails with `ELECTRON_RUN_AS_NODE`** — the Electron entrypoint already self-restarts to escape that env var (set by some IDE terminals). If you still hit it, open a fresh PowerShell outside the IDE.

**Packaged app shows "Standalone server not found"** — the `.electron-standalone` folder didn't make it into `resources/`. Re-run `npm run electron-pack`; the `electron-build` step is part of that script and produces the missing files.

**Tabuleiro/Board não aparece** — usually means a stale `.next/` build. Stop the dev server, delete `.next/`, and re-run `npm run dev`.

---

## License

GPL-3.0-only. See [`LICENCE`](LICENCE).
