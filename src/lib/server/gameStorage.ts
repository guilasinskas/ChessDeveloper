import fs from "node:fs";
import path from "node:path";
import { extractPgnHeaders, extractPgnMoveData } from "@/lib/chess";
import { Game } from "@/types/game";

export type GameSummary = Omit<Game, "pgn">;

const enrichLegacyGame = (g: Game): Game => {
  if (g.firstPlies && g.movesCount !== undefined) return g;
  if (typeof g.pgn !== "string" || g.pgn.length === 0) return g;
  const move = extractPgnMoveData(g.pgn);
  let openingName = g.openingName;
  if (!openingName) {
    const headers = extractPgnHeaders(g.pgn);
    if (headers.Opening) {
      openingName = headers.Variation
        ? `${headers.Opening}: ${headers.Variation}`
        : headers.Opening;
    }
  }
  return {
    ...g,
    openingName,
    firstPlies: move.firstPlies,
    movesCount: move.movesCount,
  };
};

const DATA_DIR = process.env.DATA_DIR
  ? process.env.DATA_DIR
  : path.join(process.cwd(), "data");
const GAMES_DIR = path.join(DATA_DIR, "games");
const INDEX_PATH = path.join(GAMES_DIR, "index.json");
const LEGACY_PATH = path.join(DATA_DIR, "games.json");

let initialized = false;
let cachedIndex: GameSummary[] = [];
let nextId = 1;

let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => T | Promise<T>): Promise<T> {
  const next = lock.then(fn, fn);
  lock = next.catch(() => undefined);
  return next as Promise<T>;
}

const summaryOf = (g: Game): GameSummary => {
  // strip pgn
  const { pgn: _pgn, ...rest } = g;
  void _pgn;
  return rest;
};

const gameFile = (id: number) => path.join(GAMES_DIR, `${id}.json`);

const writeIndex = () => {
  fs.writeFileSync(INDEX_PATH, JSON.stringify(cachedIndex), "utf-8");
};

const ensureLayout = () => {
  if (!fs.existsSync(GAMES_DIR)) fs.mkdirSync(GAMES_DIR, { recursive: true });
  if (!fs.existsSync(INDEX_PATH)) fs.writeFileSync(INDEX_PATH, "[]", "utf-8");
};

const migrateLegacyIfNeeded = () => {
  if (!fs.existsSync(LEGACY_PATH)) return;
  let currentIndex: GameSummary[] = [];
  try {
    currentIndex = JSON.parse(
      fs.readFileSync(INDEX_PATH, "utf-8")
    ) as GameSummary[];
  } catch {
    currentIndex = [];
  }
  if (currentIndex.length > 0) return;

  let legacy: Game[] = [];
  try {
    legacy = JSON.parse(fs.readFileSync(LEGACY_PATH, "utf-8")) as Game[];
  } catch {
    return;
  }

  if (Array.isArray(legacy) && legacy.length > 0) {
    const summaries: GameSummary[] = [];
    for (const g of legacy) {
      if (typeof g?.id !== "number") continue;
      const enriched = enrichLegacyGame(g);
      fs.writeFileSync(
        gameFile(enriched.id),
        JSON.stringify(enriched),
        "utf-8"
      );
      summaries.push(summaryOf(enriched));
    }
    fs.writeFileSync(INDEX_PATH, JSON.stringify(summaries), "utf-8");
  }

  try {
    fs.renameSync(LEGACY_PATH, `${LEGACY_PATH}.bak`);
  } catch {
    /* ignore — best effort */
  }
};

const init = () => {
  if (initialized) return;
  ensureLayout();
  migrateLegacyIfNeeded();
  try {
    cachedIndex = JSON.parse(
      fs.readFileSync(INDEX_PATH, "utf-8")
    ) as GameSummary[];
  } catch {
    cachedIndex = [];
  }
  nextId = cachedIndex.reduce((m, g) => Math.max(m, g.id), 0) + 1;
  initialized = true;
};

export const readSummaries = () =>
  withLock(() => {
    init();
    return cachedIndex.slice();
  });

const NO_FOLDER_KEY = "__none__";

const slimSummary = (g: GameSummary): GameSummary => {
  const { firstPlies: _f, movesCount: _m, ...rest } = g;
  void _f;
  void _m;
  return rest;
};

export interface ReadFilteredOpts {
  folder?: string;
  q?: string;
  limit?: number;
  offset?: number;
  light?: boolean;
}

export interface ReadFilteredResult {
  items: GameSummary[];
  total: number;
  totalAll: number;
  totalUnfoldered: number;
  folders: { name: string; count: number }[];
}

export const readFiltered = (
  opts: ReadFilteredOpts
): Promise<ReadFilteredResult> =>
  withLock(() => {
    init();
    const { folder, q, limit, offset = 0, light } = opts;
    const ql = q?.toLowerCase().trim();

    let filtered: GameSummary[] = cachedIndex;
    const needsFilter = folder !== undefined || (ql && ql.length > 0);
    if (needsFilter) {
      filtered = cachedIndex.filter((g) => {
        if (folder === NO_FOLDER_KEY) {
          if (g.folder) return false;
        } else if (folder !== undefined && g.folder !== folder) {
          return false;
        }
        if (ql) {
          const hit =
            g.white.name.toLowerCase().includes(ql) ||
            g.black.name.toLowerCase().includes(ql) ||
            (g.event ?? "").toLowerCase().includes(ql);
          if (!hit) return false;
        }
        return true;
      });
    }

    const total = filtered.length;
    const sliced =
      limit !== undefined ? filtered.slice(offset, offset + limit) : filtered;
    const items = light ? sliced.map(slimSummary) : sliced;

    // Folder counts always come from the full index so the sidebar reflects
    // the whole DB, not the current filter.
    const folderCounts = new Map<string, number>();
    let totalUnfoldered = 0;
    for (const g of cachedIndex) {
      if (g.folder) {
        folderCounts.set(g.folder, (folderCounts.get(g.folder) ?? 0) + 1);
      } else {
        totalUnfoldered++;
      }
    }
    const folders = [...folderCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      items,
      total,
      totalAll: cachedIndex.length,
      totalUnfoldered,
      folders,
    };
  });

export const readGame = (id: number) =>
  withLock(() => {
    init();
    const file = gameFile(id);
    if (!fs.existsSync(file)) return undefined;
    try {
      return JSON.parse(fs.readFileSync(file, "utf-8")) as Game;
    } catch {
      return undefined;
    }
  });

export const readAllFull = () =>
  withLock(() => {
    init();
    const out: Game[] = [];
    for (const s of cachedIndex) {
      try {
        out.push(JSON.parse(fs.readFileSync(gameFile(s.id), "utf-8")) as Game);
      } catch {
        /* skip */
      }
    }
    return out;
  });

export const appendGames = (newGames: Omit<Game, "id">[]) =>
  withLock(() => {
    init();
    const added: Game[] = [];
    for (const g of newGames) {
      const id = nextId++;
      const full: Game = { ...g, id };
      fs.writeFileSync(gameFile(id), JSON.stringify(full), "utf-8");
      cachedIndex.push(summaryOf(full));
      added.push(full);
    }
    writeIndex();
    return added;
  });

export const updateGame = (id: number, patch: Partial<Game>) =>
  withLock(() => {
    init();
    const file = gameFile(id);
    if (!fs.existsSync(file)) return undefined;
    let current: Game;
    try {
      current = JSON.parse(fs.readFileSync(file, "utf-8")) as Game;
    } catch {
      return undefined;
    }
    const next: Game = { ...current, ...patch, id };
    fs.writeFileSync(file, JSON.stringify(next), "utf-8");
    const idx = cachedIndex.findIndex((s) => s.id === id);
    if (idx >= 0) {
      cachedIndex[idx] = summaryOf(next);
      writeIndex();
    }
    return next;
  });

export const deleteGame = (id: number) =>
  withLock(() => {
    init();
    const file = gameFile(id);
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
      } catch {
        /* ignore */
      }
    }
    const idx = cachedIndex.findIndex((s) => s.id === id);
    if (idx >= 0) {
      cachedIndex.splice(idx, 1);
      writeIndex();
      return true;
    }
    return false;
  });

export interface BulkImportApi {
  add: (g: Omit<Game, "id">) => number;
  count: () => number;
}

export interface ReenrichResult {
  total: number;
  enriched: number;
  alreadyEnriched: number;
  failed: number;
}

// Re-runs the precompute pass (firstPlies / movesCount / openingName) on
// every per-game file in the DB whose summary lacks those fields. Used to
// bring games imported before the new logic up to date so the stats page
// can render them properly without parsing PGNs in the browser.
export const reenrichAll = (): Promise<ReenrichResult> =>
  withLock(() => {
    init();
    const total = cachedIndex.length;
    let enriched = 0;
    let alreadyEnriched = 0;
    let failed = 0;

    for (let i = 0; i < cachedIndex.length; i++) {
      const summary = cachedIndex[i];
      if (summary.firstPlies && summary.movesCount !== undefined) {
        alreadyEnriched++;
        continue;
      }
      const file = gameFile(summary.id);
      try {
        const game = JSON.parse(fs.readFileSync(file, "utf-8")) as Game;
        const next = enrichLegacyGame(game);
        if (next.firstPlies !== undefined) {
          fs.writeFileSync(file, JSON.stringify(next), "utf-8");
          cachedIndex[i] = summaryOf(next);
          enriched++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }

      // Periodic index flush so a long re-enrich is recoverable if interrupted.
      if (enriched > 0 && enriched % 1000 === 0) writeIndex();
    }

    if (enriched > 0) writeIndex();
    return { total, enriched, alreadyEnriched, failed };
  });

export const withBulkImport = <T>(
  cb: (api: BulkImportApi) => T | Promise<T>
): Promise<T> =>
  withLock(async () => {
    init();
    let added = 0;
    const api: BulkImportApi = {
      add: (g) => {
        const id = nextId++;
        const full: Game = { ...g, id };
        fs.writeFileSync(gameFile(id), JSON.stringify(full), "utf-8");
        cachedIndex.push(summaryOf(full));
        added++;
        return id;
      },
      count: () => added,
    };
    try {
      const result = await cb(api);
      writeIndex();
      return result;
    } catch (err) {
      // Persist whatever was written so far so a partial import is recoverable.
      writeIndex();
      throw err;
    }
  });
