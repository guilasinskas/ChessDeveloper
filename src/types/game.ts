import { GameEval } from "./eval";

export interface Game {
  id: number;
  pgn: string;
  event?: string;
  site?: string;
  date?: string;
  round?: string;
  white: Player;
  black: Player;
  result?: string;
  eval?: GameEval;
  termination?: string;
  timeControl?: string;
  folder?: string;
  // Precomputed at write time so the stats page can aggregate without
  // parsing tens of thousands of PGNs in the browser.
  openingName?: string;
  firstPlies?: string[];
  movesCount?: number;
}

// What the games list API returns by default — the heavy `pgn` field is
// fetched on demand via /api/games/:id so listings stay cheap at scale.
export type GameSummary = Omit<Game, "pgn">;

export interface Player {
  name: string;
  rating?: number;
  avatarUrl?: string;
  title?: string;
}

export interface LoadedGame {
  id: string;
  pgn: string;
  date?: string;
  white: Player;
  black: Player;
  result?: string;
  timeControl?: string;
  movesNb?: number;
  url?: string;
}
