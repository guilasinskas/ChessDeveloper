import { formatGameToDatabase } from "@/lib/chess";
import { GameEval } from "@/types/eval";
import { Game, GameSummary } from "@/types/game";
import { Chess } from "chess.js";
import { atom, useAtom } from "jotai";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

const gamesAtom = atom<GameSummary[]>([]);
const fetchGamesAtom = atom<boolean>(false);

export interface ImportPgnResult {
  imported: number;
  skipped: number;
  firstId?: number;
  lastId?: number;
}

export interface ImportPgnOptions {
  folder?: string;
  onProgress?: (sentBytes: number, totalBytes: number) => void;
  signal?: AbortSignal;
}

export const useGameDatabase = (shouldFetchGames?: boolean) => {
  const [games, setGames] = useAtom(gamesAtom);
  const [fetchGames, setFetchGames] = useAtom(fetchGamesAtom);
  const [isReady, setIsReady] = useState(false);
  const [gameFromUrl, setGameFromUrl] = useState<Game | undefined>(undefined);

  useEffect(() => {
    if (shouldFetchGames !== undefined) {
      setFetchGames(shouldFetchGames);
    }
  }, [shouldFetchGames, setFetchGames]);

  const loadGames = useCallback(async () => {
    if (!fetchGames) return;
    try {
      const res = await fetch("/api/games");
      const data = (await res.json()) as { items: GameSummary[] };
      setGames(data.items ?? []);
    } catch (err) {
      console.error("Failed to load games", err);
    } finally {
      setIsReady(true);
    }
  }, [fetchGames, setGames]);

  // Force-refresh, bypassing the `fetchGames` gate. Used by callers that have
  // just mutated the DB server-side and need the atom updated regardless of
  // whether they were the page that originally opted in to fetching.
  const refreshGames = useCallback(async () => {
    try {
      const res = await fetch("/api/games");
      const data = (await res.json()) as { items: GameSummary[] };
      setGames(data.items ?? []);
    } catch (err) {
      console.error("Failed to refresh games", err);
    }
  }, [setGames]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const addGame = useCallback(
    async (game: Chess, folder?: string) => {
      const gameToAdd = { ...formatGameToDatabase(game), folder };
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gameToAdd),
      });
      if (!res.ok) throw new Error("Failed to add game");
      const [added]: Game[] = await res.json();
      const { pgn: _pgn, ...summary } = added;
      void _pgn;
      setGames((prev) => [...prev, summary]);
      return added.id;
    },
    [setGames]
  );

  const addGames = useCallback(
    async (chessGames: Chess[], folder?: string) => {
      const gamesToAdd = chessGames.map((g) => ({
        ...formatGameToDatabase(g),
        folder,
      }));
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gamesToAdd),
      });
      if (!res.ok) throw new Error("Failed to add games");
      const added: Game[] = await res.json();
      const summaries: GameSummary[] = added.map(({ pgn: _pgn, ...rest }) => {
        void _pgn;
        return rest;
      });
      setGames((prev) => [...prev, ...summaries]);
      return added.map((g) => g.id);
    },
    [setGames]
  );

  const importPgnFile = useCallback(
    async (
      input: Blob | string,
      { folder, onProgress, signal }: ImportPgnOptions = {}
    ): Promise<ImportPgnResult> => {
      const url =
        "/api/games/import" +
        (folder ? `?folder=${encodeURIComponent(folder)}` : "");

      const result = await new Promise<ImportPgnResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        if (onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(e.loaded, e.total);
          };
        }
        if (signal) {
          if (signal.aborted) {
            xhr.abort();
            reject(new DOMException("Aborted", "AbortError"));
            return;
          }
          signal.addEventListener("abort", () => xhr.abort());
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText) as ImportPgnResult);
            } catch (err) {
              reject(err);
            }
          } else {
            reject(
              new Error(
                `Import failed (${xhr.status}): ${xhr.responseText || xhr.statusText}`
              )
            );
          }
        };
        xhr.onerror = () => reject(new Error("Network error during import"));
        xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
        xhr.send(input);
      });

      // Refresh the index so the new games show up in the listing.
      try {
        const res = await fetch("/api/games");
        if (res.ok) {
          const data = (await res.json()) as { items: GameSummary[] };
          setGames(data.items ?? []);
        }
      } catch {
        /* ignore — caller can still trust `imported` count */
      }

      return result;
    },
    [setGames]
  );

  const setGameEval = useCallback(
    async (gameId: number, evaluation: GameEval) => {
      const res = await fetch(`/api/games?id=${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eval: evaluation }),
      });
      if (!res.ok) throw new Error("Failed to update game eval");
      const updated: Game = await res.json();
      const { pgn: _pgn, ...summary } = updated;
      void _pgn;
      setGames((prev) => prev.map((g) => (g.id === gameId ? summary : g)));
    },
    [setGames]
  );

  const getGame = useCallback(
    async (gameId: number): Promise<Game | undefined> => {
      try {
        const res = await fetch(`/api/games/${gameId}`);
        if (!res.ok) return undefined;
        return (await res.json()) as Game;
      } catch {
        return undefined;
      }
    },
    []
  );

  const deleteGame = useCallback(
    async (gameId: number) => {
      const res = await fetch(`/api/games?id=${gameId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete game");
      setGames((prev) => prev.filter((g) => g.id !== gameId));
    },
    [setGames]
  );

  const moveGameToFolder = useCallback(
    async (gameId: number, folder: string | undefined) => {
      const res = await fetch(`/api/games?id=${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
      });
      if (!res.ok) throw new Error("Failed to update game folder");
      const updated: Game = await res.json();
      const { pgn: _pgn, ...summary } = updated;
      void _pgn;
      setGames((prev) => prev.map((g) => (g.id === gameId ? summary : g)));
    },
    [setGames]
  );

  const router = useRouter();
  const { gameId } = router.query;

  useEffect(() => {
    if (typeof gameId !== "string") {
      setGameFromUrl(undefined);
      return;
    }
    const id = parseInt(gameId);
    let cancelled = false;
    fetch(`/api/games/${id}`)
      .then((r) => (r.ok ? r.json() : undefined))
      .then((g: Game | undefined) => {
        if (!cancelled) setGameFromUrl(g);
      })
      .catch(() => {
        if (!cancelled) setGameFromUrl(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  return {
    addGame,
    addGames,
    importPgnFile,
    refreshGames,
    setGameEval,
    getGame,
    deleteGame,
    moveGameToFolder,
    games,
    isReady,
    gameFromUrl,
  };
};
