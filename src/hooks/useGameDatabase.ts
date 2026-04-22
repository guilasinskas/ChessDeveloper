import { formatGameToDatabase } from "@/lib/chess";
import { GameEval } from "@/types/eval";
import { Game } from "@/types/game";
import { Chess } from "chess.js";
import { atom, useAtom } from "jotai";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

const gamesAtom = atom<Game[]>([]);
const fetchGamesAtom = atom<boolean>(false);

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
      const data: Game[] = await res.json();
      setGames(data);
    } catch (err) {
      console.error("Failed to load games", err);
    } finally {
      setIsReady(true);
    }
  }, [fetchGames, setGames]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const addGame = useCallback(
    async (game: Chess) => {
      const gameToAdd = formatGameToDatabase(game);
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gameToAdd),
      });
      if (!res.ok) throw new Error("Failed to add game");
      const [added]: Game[] = await res.json();
      setGames((prev) => [...prev, added]);
      return added.id;
    },
    [setGames]
  );

  const addGames = useCallback(
    async (chessGames: Chess[]) => {
      const gamesToAdd = chessGames.map(formatGameToDatabase);
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gamesToAdd),
      });
      if (!res.ok) throw new Error("Failed to add games");
      const added: Game[] = await res.json();
      setGames((prev) => [...prev, ...added]);
      return added.map((g) => g.id);
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
      setGames((prev) => prev.map((g) => (g.id === gameId ? updated : g)));
    },
    [setGames]
  );

  const getGame = useCallback(
    async (gameId: number) => {
      return games.find((g) => g.id === gameId);
    },
    [games]
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
      setGames((prev) => prev.map((g) => (g.id === gameId ? updated : g)));
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
    const fromMemory = games.find((g) => g.id === id);
    if (fromMemory) {
      setGameFromUrl(fromMemory);
      return;
    }
    fetch("/api/games")
      .then((r) => r.json())
      .then((all: Game[]) => {
        setGameFromUrl(all.find((g) => g.id === id));
      })
      .catch(() => setGameFromUrl(undefined));
  }, [gameId, games]);

  return {
    addGame,
    addGames,
    setGameEval,
    getGame,
    deleteGame,
    moveGameToFolder,
    games,
    isReady,
    gameFromUrl,
  };
};
