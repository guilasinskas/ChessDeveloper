import { extractPgnMoveData } from "@/lib/chess";
import { getChessComUserGamesForStats } from "@/lib/chessCom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { GameSummary, LoadedGame } from "@/types/game";
import { Chess } from "chess.js";
import { CC } from "@/constants";
import { Chessboard } from "react-chessboard";
import {
  Box,
  Grid2 as Grid,
  Typography,
  useTheme,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { PageTitle } from "@/components/pageTitle";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";

// ─── types ────────────────────────────────────────────────────────────────────

interface SimpleGame {
  white: { name: string };
  black: { name: string };
  result?: string;
  // Precomputed at write time (from `formatPgnToDatabase`) so the stats page
  // never has to parse a full PGN on the client side.
  firstPlies: string[];
  movesCount: number;
  openingName?: string;
}

interface OpeningStat {
  name: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  fen?: string;
}

interface MoveStat {
  san: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
}

type Source = "database" | "chessCom";

const PERIOD_OPTIONS = [
  { label: "1 month", value: 1 },
  { label: "3 months", value: 3 },
  { label: "6 months", value: 6 },
  { label: "1 year", value: 12 },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function getOpeningName(game: SimpleGame): string {
  if (game.openingName) return game.openingName;
  if (!game.firstPlies.length) return "Unknown";
  return game.firstPlies.slice(0, 6).join(" ");
}

// Replays the first ~6 plies from the SAN list. Cheap — only invoked for the
// small set of opening cards we actually render, never for every game.
function getOpeningFenFromPlies(plies: string[]): string | undefined {
  if (!plies.length) return undefined;
  const chess = new Chess();
  for (let i = 0; i < Math.min(6, plies.length); i++) {
    try {
      chess.move(plies[i]);
    } catch {
      break;
    }
  }
  return chess.fen();
}

function detectPlayer(games: SimpleGame[]): string | null {
  const youGame = games.find(
    (g) => g.white.name === "You" || g.black.name === "You"
  );
  if (youGame) return "You";

  const engineTerms = ["stockfish", "computer", "engine", "bot"];
  const counts = new Map<string, number>();
  for (const g of games) {
    const isEngineW = engineTerms.some((t) =>
      g.white.name.toLowerCase().includes(t)
    );
    const isEngineB = engineTerms.some((t) =>
      g.black.name.toLowerCase().includes(t)
    );
    if (!isEngineW)
      counts.set(g.white.name, (counts.get(g.white.name) ?? 0) + 1);
    if (!isEngineB)
      counts.set(g.black.name, (counts.get(g.black.name) ?? 0) + 1);
  }
  if (!counts.size) return null;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

type ColorFilter = "all" | "w" | "b";

function computeStats(
  games: SimpleGame[],
  player: string | null,
  colorFilter: ColorFilter = "all"
) {
  const openings = new Map<
    string,
    { wins: number; draws: number; losses: number; fen?: string }
  >();
  let totalWins = 0,
    totalDraws = 0,
    totalLosses = 0,
    totalMoves = 0,
    longestGame = 0;

  for (const game of games) {
    let asWhite: boolean;
    if (player) {
      const isWhite = game.white.name.toLowerCase() === player.toLowerCase();
      const isBlack = game.black.name.toLowerCase() === player.toLowerCase();
      if (!isWhite && !isBlack) continue;
      asWhite = isWhite;
    } else {
      asWhite = true;
    }

    if (colorFilter === "w" && !asWhite) continue;
    if (colorFilter === "b" && asWhite) continue;

    let result: "win" | "draw" | "loss" | null = null;
    if (game.result === "1-0") result = asWhite ? "win" : "loss";
    else if (game.result === "0-1") result = asWhite ? "loss" : "win";
    else if (game.result === "1/2-1/2") result = "draw";
    if (!result) continue;

    if (result === "win") totalWins++;
    else if (result === "draw") totalDraws++;
    else totalLosses++;

    totalMoves += game.movesCount;
    if (game.movesCount > longestGame) longestGame = game.movesCount;

    const opening = getOpeningName(game);
    if (!openings.has(opening)) {
      openings.set(opening, {
        wins: 0,
        draws: 0,
        losses: 0,
        fen: getOpeningFenFromPlies(game.firstPlies),
      });
    }
    const s = openings.get(opening)!;
    if (result === "win") s.wins++;
    else if (result === "draw") s.draws++;
    else s.losses++;
  }

  const total = totalWins + totalDraws + totalLosses;
  const openingStats: OpeningStat[] = [...openings.entries()]
    .map(([name, s]) => ({
      name,
      games: s.wins + s.draws + s.losses,
      wins: s.wins,
      draws: s.draws,
      losses: s.losses,
      fen: s.fen,
    }))
    .sort((a, b) => b.games - a.games);

  const avgMoves = total > 0 ? Math.round(totalMoves / total) : 0;
  return {
    total,
    totalWins,
    totalDraws,
    totalLosses,
    avgMoves,
    longestGame: longestGame || null,
    openingStats,
  };
}

function summaryToSimple(g: GameSummary): SimpleGame {
  return {
    white: { name: g.white.name },
    black: { name: g.black.name },
    result: g.result,
    firstPlies: g.firstPlies ?? [],
    movesCount: g.movesCount ?? g.firstPlies?.length ?? 0,
    openingName: g.openingName,
  };
}

// Chess.com results come with the full PGN — we extract the same precomputed
// fields on the fly. The N is small (~hundreds), so client-side parsing is OK.
function loadedGameToSimple(g: LoadedGame): SimpleGame {
  const move = g.pgn
    ? extractPgnMoveData(g.pgn)
    : { firstPlies: [], movesCount: 0 };
  return {
    white: { name: g.white.name },
    black: { name: g.black.name },
    result: g.result,
    firstPlies: move.firstPlies,
    movesCount: move.movesCount,
    openingName: undefined,
  };
}

// ─── subcomponents ────────────────────────────────────────────────────────────

/**
 * Headline number card — Stitch "Total Games" / "Avg Moves" pattern.
 * Big Manrope number, label-caps row at top, optional footer line.
 */
function StatCard({
  label,
  value,
  icon,
  iconColor,
  footer,
}: {
  label: string;
  value: string | number;
  icon: string;
  iconColor?: string;
  footer?: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 160,
        p: 2.5,
        borderRadius: "var(--cc-radius-xl)",
        backgroundColor: "var(--cc-surface-container-lowest)",
        boxShadow: "var(--cc-shadow-ambient)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 130,
      }}
    >
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Icon icon={icon} width={20} color={iconColor ?? CC.primary} />
          <Typography
            sx={{
              fontFamily: "var(--cc-font-body)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: CC.textSub,
            }}
          >
            {label}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontFamily: "var(--cc-font-headline)",
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: CC.text,
          }}
        >
          {value}
        </Typography>
      </Box>
      {footer && (
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: `1px solid ${CC.border}`,
            fontSize: 13,
          }}
        >
          {footer}
        </Box>
      )}
    </Box>
  );
}

/**
 * Circular ring stat — Stitch "Win Rate / Draws / Losses" pattern.
 * SVG ring with stroke-dashoffset proportional to value (0-100).
 */
function RingStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - value / 100);
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 160,
        p: 2.5,
        borderRadius: "var(--cc-radius-xl)",
        backgroundColor: "var(--cc-surface-container-lowest)",
        boxShadow: "var(--cc-shadow-ambient)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 130,
        position: "relative",
      }}
    >
      <Box sx={{ position: "relative", width: 96, height: 96 }}>
        <svg
          width={96}
          height={96}
          style={{ transform: "rotate(-90deg)", display: "block" }}
        >
          <circle
            cx={48}
            cy={48}
            r={40}
            fill="transparent"
            stroke="var(--cc-surface-container-high)"
            strokeWidth={8}
          />
          <circle
            cx={48}
            cy={48}
            r={40}
            fill="transparent"
            stroke={color}
            strokeWidth={8}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 500ms ease" }}
          />
        </svg>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{
              fontFamily: "var(--cc-font-headline)",
              fontSize: 22,
              fontWeight: 800,
              color,
            }}
          >
            {value}%
          </Typography>
        </Box>
      </Box>
      <Typography
        sx={{
          mt: 1.5,
          fontFamily: "var(--cc-font-body)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: CC.textSub,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function ResultBar({ wins, draws, losses }: OpeningStat) {
  const total = wins + draws + losses;
  if (!total) return null;
  const wPct = (wins / total) * 100;
  const dPct = (draws / total) * 100;
  const lPct = (losses / total) * 100;

  return (
    <Tooltip title={`${wins}W / ${draws}D / ${losses}L`}>
      <Box
        sx={{
          display: "flex",
          height: 8,
          borderRadius: "var(--cc-radius-pill)",
          overflow: "hidden",
          width: "100%",
          minWidth: 80,
          cursor: "default",
          backgroundColor: "var(--cc-surface-container-high)",
        }}
      >
        {wPct > 0 && (
          <Box sx={{ width: `${wPct}%`, backgroundColor: CC.primary }} />
        )}
        {dPct > 0 && (
          <Box sx={{ width: `${dPct}%`, backgroundColor: CC.textMuted }} />
        )}
        {lPct > 0 && (
          <Box sx={{ width: `${lPct}%`, backgroundColor: CC.error }} />
        )}
      </Box>
    </Tooltip>
  );
}

/**
 * Most-played opening highlight — Stitch peach card with success-rate bar.
 * Variant "peach" gives the peach affective background (matches MOST PLAYED
 * tile in the reference). Variant "neutral" used for the regular Best/Worst
 * highlight that lived beside the most played in the old layout.
 */
function HighlightCard({
  title,
  name,
  sub,
  icon,
  successRate,
  variant = "neutral",
}: {
  title: string;
  name: string;
  sub: string;
  icon: string;
  successRate?: number;
  variant?: "peach" | "neutral";
}) {
  const isPeach = variant === "peach";
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 220,
        p: 3,
        borderRadius: "var(--cc-radius-xl)",
        backgroundColor: isPeach
          ? "color-mix(in srgb, var(--cc-secondary-container) 50%, var(--cc-surface-container-lowest))"
          : "var(--cc-surface-container-lowest)",
        boxShadow: "var(--cc-shadow-ambient)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 200,
      }}
    >
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}>
          <Icon
            icon={icon}
            width={18}
            color={isPeach ? "var(--cc-on-secondary-container)" : CC.primary}
          />
          <Typography
            sx={{
              fontFamily: "var(--cc-font-body)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: isPeach
                ? "var(--cc-on-secondary-container)"
                : CC.textSub,
            }}
          >
            {title}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontFamily: "var(--cc-font-headline)",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: CC.text,
            lineHeight: 1.2,
            mb: 1,
          }}
          title={name}
        >
          {name}
        </Typography>
        <Typography
          sx={{
            fontFamily: "var(--cc-font-body)",
            fontSize: 14,
            color: CC.textSub,
          }}
        >
          {sub}
        </Typography>
      </Box>
      {typeof successRate === "number" && (
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              mb: 0.75,
            }}
          >
            <Typography
              sx={{
                fontFamily: "var(--cc-font-body)",
                fontSize: 13,
                fontWeight: 700,
                color: CC.text,
              }}
            >
              Success Rate
            </Typography>
            <Typography
              sx={{
                fontFamily: "var(--cc-font-headline)",
                fontSize: 24,
                fontWeight: 800,
                color: CC.primary,
              }}
            >
              {successRate}%
            </Typography>
          </Box>
          <Box
            sx={{
              width: "100%",
              height: 8,
              borderRadius: "var(--cc-radius-pill)",
              backgroundColor: "rgba(255, 255, 255, 0.5)",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${Math.min(100, Math.max(0, successRate))}%`,
                height: "100%",
                backgroundColor: CC.primary,
                borderRadius: "var(--cc-radius-pill)",
                transition: "width 500ms ease",
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}

function MiniBoard({ fen }: { fen: string }) {
  return (
    <Box
      sx={{
        borderRadius: "var(--cc-radius-md)",
        overflow: "hidden",
        boxShadow: "var(--cc-shadow-ambient)",
        lineHeight: 0,
        padding: "8px",
        backgroundColor: "var(--cc-surface-container-highest)",
      }}
    >
      <Chessboard
        position={fen}
        boardWidth={180}
        arePiecesDraggable={false}
        customLightSquareStyle={{ backgroundColor: "#e8e4d7" }}
        customDarkSquareStyle={{ backgroundColor: "#55624d" }}
        customBoardStyle={{ borderRadius: "8px" }}
      />
    </Box>
  );
}

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function MoveChip({
  move,
  selected,
  onClick,
}: {
  move: MoveStat;
  selected?: boolean;
  onClick: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const winPct = Math.round((move.wins / move.games) * 100);
  const winColor =
    winPct >= 60 ? "#22ac38" : winPct <= 35 ? "#f73c3c" : CC.primary;

  return (
    <Tooltip title={`${move.wins}W / ${move.draws}D / ${move.losses}L`}>
      <Box
        onClick={onClick}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.6,
          px: 1.2,
          py: 0.5,
          borderRadius: "4px",
          border: `1.5px solid ${selected ? CC.primary : isDark ? CC.border : CC.lBorder}`,
          backgroundColor: selected
            ? CC.primaryMuted
            : isDark
              ? CC.bg3
              : CC.lBg3,
          cursor: "pointer",
          transition: "border-color 120ms, background-color 120ms",
          "&:hover": {
            borderColor: isDark ? CC.borderHover : "#a8a8a0",
            backgroundColor: CC.primarySubtle,
          },
        }}
      >
        <Typography
          sx={{
            fontSize: "0.8rem",
            fontWeight: 700,
            color: isDark ? CC.text : CC.lText,
            minWidth: 26,
          }}
        >
          {move.san}
        </Typography>
        <Typography
          sx={{ fontSize: "0.72rem", fontWeight: 700, color: winColor }}
        >
          {winPct}%
        </Typography>
        <Typography
          sx={{ fontSize: "0.65rem", color: isDark ? CC.textMuted : "#a0a09e" }}
        >
          {move.games}g
        </Typography>
      </Box>
    </Tooltip>
  );
}

function MoveBreakdown({
  games,
  player,
  colorFilter,
}: {
  games: SimpleGame[];
  player: string | null;
  colorFilter: ColorFilter;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [selectedMoves, setSelectedMoves] = useState<string[]>([]);

  // Reset path when filters change
  useEffect(() => setSelectedMoves([]), [colorFilter, player]);

  // Build qualifying-games list directly from precomputed firstPlies — no
  // chess.js parse here. Cheap even at 50k+ games.
  const parsedGames = useMemo(() => {
    const result: {
      plies: string[];
      result: "win" | "draw" | "loss";
    }[] = [];

    for (const game of games) {
      let gameAsWhite: boolean;
      if (player) {
        const isW = game.white.name.toLowerCase() === player.toLowerCase();
        const isB = game.black.name.toLowerCase() === player.toLowerCase();
        if (!isW && !isB) continue;
        if (colorFilter === "w" && !isW) continue;
        if (colorFilter === "b" && !isB) continue;
        gameAsWhite = isW;
      } else {
        gameAsWhite = true;
      }

      let r: "win" | "draw" | "loss" | null = null;
      if (game.result === "1-0") r = gameAsWhite ? "win" : "loss";
      else if (game.result === "0-1") r = gameAsWhite ? "loss" : "win";
      else if (game.result === "1/2-1/2") r = "draw";
      if (!r) continue;

      result.push({ plies: game.firstPlies, result: r });
    }
    return result;
  }, [games, player, colorFilter]);

  const { nextMoves, currentFen, totalMatching } = useMemo(() => {
    // Filter to games matching the selected move path (all plies, both colours)
    const matching = parsedGames.filter(({ plies }) => {
      for (let i = 0; i < selectedMoves.length; i++) {
        if (i >= plies.length || plies[i] !== selectedMoves[i]) return false;
      }
      return true;
    });

    // Replay just the selected path on chess.js — N is the breadcrumb depth,
    // not the number of games, so this stays cheap regardless of DB size.
    let currentFen = START_FEN;
    if (selectedMoves.length > 0) {
      const chess = new Chess();
      for (const san of selectedMoves) {
        try {
          chess.move(san);
        } catch {
          break;
        }
      }
      currentFen = chess.fen();
    }

    // Next move stats (any colour, sequential ply)
    const nextPly = selectedMoves.length;
    const nextMap = new Map<
      string,
      { wins: number; draws: number; losses: number }
    >();
    for (const { plies, result } of matching) {
      if (nextPly >= plies.length) continue;
      const san = plies[nextPly];
      if (!nextMap.has(san)) nextMap.set(san, { wins: 0, draws: 0, losses: 0 });
      const ms = nextMap.get(san)!;
      if (result === "win") ms.wins++;
      else if (result === "draw") ms.draws++;
      else ms.losses++;
    }

    const nextMoves: MoveStat[] = [...nextMap.entries()]
      .map(([san, s]) => ({
        san,
        games: s.wins + s.draws + s.losses,
        wins: s.wins,
        draws: s.draws,
        losses: s.losses,
      }))
      .sort((a, b) => b.games - a.games);

    return { nextMoves, currentFen, totalMatching: matching.length };
  }, [parsedGames, selectedMoves]);

  if (!parsedGames.length) return null;

  // Breadcrumb: "1. e4 e5 2. Nf3 Nc6 …" — proper chess notation
  const breadcrumb = selectedMoves.map((san, ply) => {
    const moveNum = Math.floor(ply / 2) + 1;
    const isWhite = ply % 2 === 0;
    const prefix = isWhite ? `${moveNum}.` : ply === 1 ? "1…" : "";
    return { san, prefix, ply };
  });

  // Whose turn for the next move
  const nextTurn = selectedMoves.length % 2 === 0 ? "White" : "Black";

  return (
    <Box
      sx={{
        borderRadius: "6px",
        border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
        backgroundColor: isDark ? CC.bg2 : CC.lBg1,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.2,
          borderBottom: `1px solid ${isDark ? CC.border : CC.lBorder}`,
          backgroundColor: isDark ? CC.bg3 : CC.lBg2,
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography
          sx={{
            fontSize: "0.68rem",
            color: isDark ? CC.textMuted : "#a0a09e",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            flexShrink: 0,
          }}
        >
          Move tree
        </Typography>

        {/* Breadcrumb path */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            flex: 1,
            flexWrap: "wrap",
          }}
        >
          {breadcrumb.map(({ san, prefix, ply }) => (
            <Box
              key={ply}
              onClick={() => setSelectedMoves((prev) => prev.slice(0, ply + 1))}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
                cursor: "pointer",
                "&:hover span.san": { textDecoration: "underline" },
              }}
            >
              {prefix && (
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    color: isDark ? CC.textMuted : "#a0a09e",
                  }}
                >
                  {prefix}
                </Typography>
              )}
              <Typography
                component="span"
                className="san"
                sx={{ fontSize: "0.78rem", fontWeight: 600, color: CC.primary }}
              >
                {san}
              </Typography>
            </Box>
          ))}
        </Box>

        {selectedMoves.length > 0 && (
          <Box
            onClick={() => setSelectedMoves([])}
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              color: isDark ? CC.textMuted : "#a0a09e",
              "&:hover": { color: isDark ? CC.text : CC.lText },
              flexShrink: 0,
            }}
          >
            <Icon icon="mdi:close" width={14} />
          </Box>
        )}
      </Box>

      {/* Body */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          p: 2,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        {/* Move options */}
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography
            sx={{
              fontSize: "0.7rem",
              color: isDark ? CC.textMuted : "#a0a09e",
              mb: 1,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {nextTurn} plays
          </Typography>

          {nextMoves.length === 0 ? (
            <Typography
              sx={{
                fontSize: "0.8rem",
                color: isDark ? CC.textMuted : "#a0a09e",
                py: 1,
              }}
            >
              No more data for this line.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {nextMoves.map((m) => (
                <MoveChip
                  key={m.san}
                  move={m}
                  selected={
                    selectedMoves.length > 0 &&
                    selectedMoves[selectedMoves.length - 1] === m.san
                  }
                  onClick={() => setSelectedMoves((prev) => [...prev, m.san])}
                />
              ))}
            </Box>
          )}

          <Typography
            sx={{
              mt: 1.5,
              fontSize: "0.7rem",
              color: isDark ? CC.textMuted : "#a0a09e",
            }}
          >
            {totalMatching} matching game{totalMatching !== 1 ? "s" : ""}
            {selectedMoves.length > 0 ? " in this line" : ""}
          </Typography>
        </Box>

        {/* Mini board */}
        <Box sx={{ flexShrink: 0 }}>
          <MiniBoard fen={currentFen} />
        </Box>
      </Box>
    </Box>
  );
}

function OpeningRow({ stat, rank }: { stat: OpeningStat; rank: number }) {
  const winPct =
    stat.games > 0 ? Math.round((stat.wins / stat.games) * 100) : 0;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 3,
        py: 2.5,
        borderBottom: `1px solid ${CC.border}`,
        "&:last-child": { borderBottom: "none" },
        "&:hover": { backgroundColor: "var(--cc-surface-container-low)" },
        transition: "background-color 120ms ease",
      }}
    >
      <Typography
        sx={{
          width: 24,
          flexShrink: 0,
          fontFamily: "var(--cc-font-mono)",
          fontSize: 12,
          color: CC.textMuted,
          textAlign: "right",
        }}
      >
        {rank}
      </Typography>
      <Tooltip
        title={stat.fen ? <MiniBoard fen={stat.fen} /> : ""}
        placement="right"
        disableInteractive
        slotProps={{
          tooltip: {
            sx: {
              bgcolor: "transparent",
              p: 0,
              boxShadow: "none",
              maxWidth: "none",
            },
          },
        }}
      >
        <Typography
          sx={{
            flex: 1,
            fontFamily: "var(--cc-font-body)",
            fontSize: 14,
            fontWeight: 700,
            color: CC.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            cursor: stat.fen ? "default" : undefined,
          }}
          title={stat.name}
        >
          {stat.name}
        </Typography>
      </Tooltip>
      <Typography
        sx={{
          width: 48,
          flexShrink: 0,
          fontFamily: "var(--cc-font-mono)",
          fontSize: 13,
          color: CC.textSub,
          textAlign: "center",
        }}
      >
        {stat.games}
      </Typography>
      <Box sx={{ width: 160, flexShrink: 0 }}>
        <ResultBar {...stat} />
      </Box>
      <Typography
        sx={{
          width: 56,
          flexShrink: 0,
          fontFamily: "var(--cc-font-mono)",
          fontSize: 14,
          fontWeight: 700,
          textAlign: "right",
          color:
            winPct >= 60 ? CC.primary : winPct <= 35 ? CC.error : CC.text,
        }}
      >
        {winPct}%
      </Typography>
    </Box>
  );
}

// ─── Chess.com panel ──────────────────────────────────────────────────────────

function ChessComPanel({
  onGamesLoaded,
}: {
  onGamesLoaded: (games: LoadedGame[], username: string) => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [storedUsername, setStoredUsername] = useLocalStorage<string>(
    "chesscom-username",
    ""
  );
  const [inputUsername, setInputUsername] = useState(
    typeof storedUsername === "string"
      ? (storedUsername.split(",")[0]?.trim() ?? "")
      : ""
  );
  const [period, setPeriod] = useState(3);
  const [queryKey, setQueryKey] = useState<[string, string, number] | null>(
    null
  );

  const {
    data: games,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: queryKey ?? ["cc-stats-disabled"],
    enabled: !!queryKey,
    queryFn: ({ signal }) =>
      getChessComUserGamesForStats(queryKey![1], queryKey![2], signal),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Propagate loaded games upward
  useMemo(() => {
    if (games && queryKey) {
      onGamesLoaded(games, queryKey[1]);
    }
  }, [games]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoad = () => {
    const trimmed = inputUsername.trim();
    if (!trimmed) return;
    const existing =
      typeof storedUsername === "string"
        ? storedUsername
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    const updated = [
      trimmed,
      ...existing.filter((u) => u.toLowerCase() !== trimmed.toLowerCase()),
    ]
      .slice(0, 8)
      .join(",");
    setStoredUsername(updated);
    setQueryKey(["cc-stats", trimmed, period]);
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: "6px",
        border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
        backgroundColor: isDark ? CC.bg2 : CC.lBg1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <TextField
          label="Chess.com username"
          size="small"
          value={inputUsername}
          onChange={(e) => setInputUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLoad()}
          sx={{ flex: 1, minWidth: 180 }}
          slotProps={{
            input: {
              startAdornment: (
                <Box sx={{ mr: 0.5, display: "flex", alignItems: "center" }}>
                  <Icon
                    icon="simple-icons:chess-dot-com"
                    width={16}
                    color="#81b64c"
                  />
                </Box>
              ),
            },
          }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value as number)}
          >
            {PERIOD_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleLoad}
          disabled={!inputUsername.trim() || isFetching}
          startIcon={
            isFetching ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <Icon icon="mdi:download" width={16} />
            )
          }
          sx={{ height: 40 }}
        >
          {isFetching ? "Loading…" : "Load"}
        </Button>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {(error as Error)?.message ?? "Failed to load games from Chess.com"}
        </Alert>
      )}

      {games && !isFetching && (
        <Typography
          sx={{
            mt: 1,
            fontSize: "0.75rem",
            color: isDark ? CC.textMuted : "#8b91a0",
          }}
        >
          {games.length} games loaded for <strong>{queryKey?.[1]}</strong>
        </Typography>
      )}
    </Box>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const { games: dbGames, isReady, refreshGames } = useGameDatabase(true);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [source, setSource] = useState<Source>("database");
  const [chessComGames, setChessComGames] = useState<LoadedGame[] | null>(null);
  const [chessComPlayer, setChessComPlayer] = useState<string>("");

  // Games imported before the precompute pass don't carry firstPlies — they
  // show up as "Unknown" until the user triggers a refresh.
  const staleCount = useMemo(
    () => dbGames.filter((g) => !g.firstPlies).length,
    [dbGames]
  );
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string>("");

  const handleRefreshStats = async () => {
    setRefreshing(true);
    setRefreshMsg("");
    try {
      const res = await fetch("/api/games/reenrich", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = (await res.json()) as {
        enriched: number;
        alreadyEnriched: number;
        failed: number;
        total: number;
      };
      await refreshGames();
      setRefreshMsg(
        `Refreshed ${result.enriched.toLocaleString()} game${result.enriched !== 1 ? "s" : ""}` +
          (result.failed > 0 ? ` (${result.failed} failed)` : "")
      );
    } catch (err) {
      console.error(err);
      setRefreshMsg(
        err instanceof Error
          ? `Refresh failed: ${err.message}`
          : "Refresh failed"
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleChessComLoaded = (games: LoadedGame[], username: string) => {
    setChessComGames(games);
    setChessComPlayer(username);
  };

  // Active game list based on source
  const activeGames: SimpleGame[] = useMemo(() => {
    if (source === "chessCom") {
      return (chessComGames ?? []).map(loadedGameToSimple);
    }
    return dbGames.map(summaryToSimple);
  }, [source, dbGames, chessComGames]);

  // Player names for the selector
  const playerNames = useMemo(() => {
    if (source === "chessCom") return [];
    const engineTerms = ["stockfish", "computer", "engine", "bot"];
    const names = new Set<string>();
    activeGames.forEach((g) => {
      if (!engineTerms.some((t) => g.white.name.toLowerCase().includes(t)))
        names.add(g.white.name);
      if (!engineTerms.some((t) => g.black.name.toLowerCase().includes(t)))
        names.add(g.black.name);
    });
    return [...names].sort();
  }, [activeGames, source]);

  const detectedPlayer = useMemo(
    () => (source === "chessCom" ? chessComPlayer : detectPlayer(activeGames)),
    [activeGames, source, chessComPlayer]
  );

  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [colorFilter, setColorFilter] = useState<ColorFilter>("all");

  const resolvedPlayer = useMemo(() => {
    if (source === "chessCom") return chessComPlayer || null;
    if (selectedPlayer === "__all__") return null;
    if (selectedPlayer) return selectedPlayer;
    return detectedPlayer;
  }, [selectedPlayer, detectedPlayer, source, chessComPlayer]);

  const stats = useMemo(
    () => computeStats(activeGames, resolvedPlayer, colorFilter),
    [activeGames, resolvedPlayer, colorFilter]
  );

  const MIN_GAMES = 3;
  const bestOpening = useMemo(
    () =>
      stats.openingStats
        .filter((o) => o.games >= MIN_GAMES)
        .sort((a, b) => b.wins / b.games - a.wins / a.games)[0] ?? null,
    [stats]
  );
  const worstOpening = useMemo(
    () =>
      stats.openingStats
        .filter((o) => o.games >= MIN_GAMES)
        .sort((a, b) => a.wins / a.games - b.wins / b.games)[0] ?? null,
    [stats]
  );
  const mostPlayed = stats.openingStats[0] ?? null;

  const winPct =
    stats.total > 0 ? Math.round((stats.totalWins / stats.total) * 100) : 0;
  const drawPct =
    stats.total > 0 ? Math.round((stats.totalDraws / stats.total) * 100) : 0;
  const lossPct =
    stats.total > 0 ? Math.round((stats.totalLosses / stats.total) * 100) : 0;

  if (!isReady) return null;

  const hasGames =
    source === "database"
      ? dbGames.length > 0
      : (chessComGames?.length ?? 0) > 0;

  return (
    <Box>
      <PageTitle title="White to Move — Statistics" />

      {/* Sticky title bar — Stitch pattern */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
          px: { xs: 2, md: 3 },
          backgroundColor:
            "color-mix(in srgb, var(--cc-surface) 80%, transparent)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${CC.border}`,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Typography
          sx={{
            fontFamily: "var(--cc-font-headline)",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: CC.primary,
          }}
        >
          Recent Insights
        </Typography>
      </Box>

      <Grid
        container
        justifyContent="center"
        sx={{ pt: { xs: 1, lg: 2 }, px: { xs: 1, sm: 2 }, pb: 4 }}
      >
        <Grid container size={12} maxWidth={900} gap={3} direction="column">
          {/* Source selector */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <ToggleButtonGroup
            value={source}
            exclusive
            size="small"
            onChange={(_, v) => {
              if (v) setSource(v);
            }}
          >
            <ToggleButton
              value="database"
              sx={{ px: 1.5, fontSize: "0.78rem" }}
            >
              <Icon
                icon="streamline:database"
                width={14}
                style={{ marginRight: 6 }}
              />
              Database
            </ToggleButton>
            <ToggleButton
              value="chessCom"
              sx={{ px: 1.5, fontSize: "0.78rem" }}
            >
              <Icon
                icon="simple-icons:chess-dot-com"
                width={14}
                color={source === "chessCom" ? "#81b64c" : undefined}
                style={{ marginRight: 6 }}
              />
              Chess.com
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Chess.com panel */}
        {source === "chessCom" && (
          <ChessComPanel onGamesLoaded={handleChessComLoaded} />
        )}

        {/* Stale-data banner */}
        {source === "database" && (staleCount > 0 || refreshMsg) && (
          <Alert
            severity={refreshMsg && !refreshing ? "success" : "info"}
            icon={refreshing ? <CircularProgress size={18} /> : undefined}
            action={
              staleCount > 0 ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleRefreshStats}
                  disabled={refreshing}
                  startIcon={
                    !refreshing && (
                      <Icon icon="material-symbols:refresh" width={16} />
                    )
                  }
                >
                  {refreshing ? "Refreshing…" : "Refresh stats data"}
                </Button>
              ) : undefined
            }
            sx={{ alignItems: "center" }}
          >
            {refreshMsg
              ? refreshMsg
              : `${staleCount.toLocaleString()} game${staleCount !== 1 ? "s" : ""} imported before the precomputed-stats logic — refresh to include them.`}
          </Alert>
        )}

        {/* Filters row */}
        {hasGames && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            {/* Color filter */}
            <ToggleButtonGroup
              value={colorFilter}
              exclusive
              size="small"
              onChange={(_, v) => {
                if (v) setColorFilter(v);
              }}
            >
              <ToggleButton value="all" sx={{ px: 1.5, fontSize: "0.75rem" }}>
                All
              </ToggleButton>
              <ToggleButton value="w" sx={{ px: 1.5, fontSize: "0.75rem" }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: "#e8eaf4",
                    border: "1.5px solid #aaa",
                    mr: 0.7,
                    flexShrink: 0,
                  }}
                />
                White
              </ToggleButton>
              <ToggleButton value="b" sx={{ px: 1.5, fontSize: "0.75rem" }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: "#222",
                    border: "1.5px solid #666",
                    mr: 0.7,
                    flexShrink: 0,
                  }}
                />
                Black
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Player selector (database only) */}
            {source === "database" && dbGames.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Player</InputLabel>
                <Select
                  value={selectedPlayer || detectedPlayer || "__all__"}
                  label="Player"
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                >
                  <MenuItem value="__all__">All games</MenuItem>
                  {playerNames.map((n) => (
                    <MenuItem key={n} value={n}>
                      {n}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        )}

        {!hasGames ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Icon
              icon={
                source === "database"
                  ? "streamline:database"
                  : "simple-icons:chess-dot-com"
              }
              width={40}
              color={isDark ? CC.textMuted : "#a0a09e"}
            />
            <Typography
              sx={{ mt: 2, color: isDark ? CC.textMuted : "#a0a09e" }}
            >
              {source === "database"
                ? "No games in database yet. Add games to see statistics."
                : "Enter your Chess.com username and click Load to see statistics."}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Bento Grid — 5 metric cards (Stitch "Summary" pattern) */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr 1fr",
                  md: "repeat(5, 1fr)",
                },
                gap: 2,
              }}
            >
              <StatCard
                label="Total Games"
                value={stats.total.toLocaleString()}
                icon="material-symbols:sports-esports-outline"
                footer={
                  <Typography sx={{ fontSize: 13, color: CC.textSub }}>
                    Longest game:{" "}
                    <Box
                      component="span"
                      sx={{
                        fontFamily: "var(--cc-font-mono)",
                        fontWeight: 700,
                        color: CC.text,
                      }}
                    >
                      {stats.longestGame ?? "—"}
                    </Box>
                  </Typography>
                }
              />
              <RingStat label="Win Rate" value={winPct} color={CC.primary} />
              <RingStat
                label="Draws"
                value={drawPct}
                color="var(--cc-on-surface-variant)"
              />
              <RingStat label="Losses" value={lossPct} color={CC.error} />
              <StatCard
                label="Avg Moves"
                value={stats.avgMoves}
                icon="material-symbols:timeline-outline"
                footer={
                  <Typography sx={{ fontSize: 13, color: CC.textSub }}>
                    Across all games
                  </Typography>
                }
              />
            </Box>

            {/* Most Played + Move Tree — 1/3 + 2/3 split */}
            {mostPlayed && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", lg: "1fr 2fr" },
                  gap: 3,
                }}
              >
                <HighlightCard
                  title="Most Played Opening"
                  name={mostPlayed.name}
                  sub={`Played ${mostPlayed.games} time${
                    mostPlayed.games !== 1 ? "s" : ""
                  } this season`}
                  icon="material-symbols:local-fire-department-outline"
                  successRate={Math.round(
                    (mostPlayed.wins / mostPlayed.games) * 100
                  )}
                  variant="peach"
                />
                <MoveBreakdown
                  games={activeGames}
                  player={resolvedPlayer}
                  colorFilter={colorFilter}
                />
              </Box>
            )}

            {!mostPlayed && (
              <MoveBreakdown
                games={activeGames}
                player={resolvedPlayer}
                colorFilter={colorFilter}
              />
            )}

            {/* Opening Performance table — Stitch detailed table card */}
            <Box
              sx={{
                borderRadius: "var(--cc-radius-xl)",
                overflow: "hidden",
                backgroundColor: "var(--cc-surface-container-lowest)",
                boxShadow: "var(--cc-shadow-ambient)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 3,
                  py: 2.5,
                  borderBottom: `1px solid ${CC.border}`,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "var(--cc-font-headline)",
                    fontSize: 22,
                    fontWeight: 700,
                    color: CC.text,
                  }}
                >
                  Opening Performance
                </Typography>
                {(bestOpening || worstOpening) && (
                  <Typography
                    sx={{
                      fontFamily: "var(--cc-font-body)",
                      fontSize: 13,
                      color: CC.textSub,
                    }}
                  >
                    Showing top {Math.min(stats.openingStats.length, 30)}
                  </Typography>
                )}
              </Box>

              {/* Column headers */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 3,
                  py: 1.5,
                  backgroundColor: "var(--cc-surface-container-low)",
                }}
              >
                {[
                  { label: "#", width: 24, align: "right" as const },
                  { label: "OPENING NAME", flex: true },
                  { label: "GAMES", width: 48, align: "center" as const },
                  { label: "RESULTS DISTRIBUTION", width: 160 },
                  { label: "WIN %", width: 56, align: "right" as const },
                ].map(({ label, width, flex, align }) => (
                  <Typography
                    key={label}
                    sx={{
                      ...(flex ? { flex: 1 } : { width, flexShrink: 0 }),
                      fontFamily: "var(--cc-font-body)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: CC.textSub,
                      textAlign: align,
                    }}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>

              {stats.openingStats.length === 0 ? (
                <Box sx={{ px: 3, py: 6, textAlign: "center" }}>
                  <Typography
                    sx={{
                      fontFamily: "var(--cc-font-body)",
                      fontSize: 14,
                      color: CC.textSub,
                    }}
                  >
                    No completed games found for this player.
                  </Typography>
                </Box>
              ) : (
                stats.openingStats
                  .slice(0, 30)
                  .map((stat, i) => (
                    <OpeningRow key={stat.name} stat={stat} rank={i + 1} />
                  ))
              )}
            </Box>

            {/* Legend */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              {[
                { color: "#22ac38", label: "Win" },
                { color: "#8b91a0", label: "Draw" },
                { color: "#f73c3c", label: "Loss" },
              ].map(({ color, label }) => (
                <Box
                  key={label}
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "2px",
                      backgroundColor: color,
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      color: isDark ? CC.textMuted : "#a0a09e",
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
        </Grid>
      </Grid>
    </Box>
  );
}
