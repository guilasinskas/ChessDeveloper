import { useGameDatabase } from "@/hooks/useGameDatabase";
import { getGameFromPgn } from "@/lib/chess";
import { getChessComUserGamesForStats } from "@/lib/chessCom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Game, LoadedGame } from "@/types/game";
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
  pgn: string;
  white: { name: string };
  black: { name: string };
  result?: string;
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

function getOpeningName(pgn: string): string {
  const opening = pgn.match(/\[Opening "([^"]+)"\]/)?.[1];
  const variation = pgn.match(/\[Variation "([^"]+)"\]/)?.[1];

  if (opening) return variation ? `${opening}: ${variation}` : opening;

  try {
    const game = getGameFromPgn(pgn);
    const history = game.history();
    if (!history.length) return "Unknown";
    return history.slice(0, 6).join(" ");
  } catch {
    return "Unknown";
  }
}

function getOpeningFen(pgn: string): string | undefined {
  try {
    const g = getGameFromPgn(pgn);
    const history = g.history({ verbose: true });
    if (!history.length) return undefined;
    return history[Math.min(5, history.length - 1)].after;
  } catch {
    return undefined;
  }
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
    totalMoves = 0;

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

    // Parse game once for moves + opening FEN + per-move stats
    let parsedHistory: { san: string }[] | null = null;
    try {
      const parsed = getGameFromPgn(game.pgn);
      parsedHistory = parsed.history({ verbose: true });
      totalMoves += parsedHistory.length;
    } catch {
      /* skip */
    }

    const opening = getOpeningName(game.pgn);
    if (!openings.has(opening)) {
      openings.set(opening, {
        wins: 0,
        draws: 0,
        losses: 0,
        fen: getOpeningFen(game.pgn),
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
  return { total, totalWins, totalDraws, totalLosses, avgMoves, openingStats };
}

function toSimpleGames(games: (Game | LoadedGame)[]): SimpleGame[] {
  return games.map((g) => ({
    pgn: g.pgn,
    white: { name: g.white.name },
    black: { name: g.black.name },
    result: g.result,
  }));
}

// ─── subcomponents ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 120,
        p: 2,
        borderRadius: "6px",
        backgroundColor: isDark ? CC.bg2 : CC.lBg1,
        border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Icon
          icon={icon}
          width={14}
          color={color ?? (isDark ? CC.textMuted : "#8b91a0")}
        />
        <Typography
          sx={{ fontSize: "0.7rem", color: isDark ? CC.textMuted : "#8b91a0" }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontSize: "1.5rem",
          fontWeight: 700,
          lineHeight: 1,
          color: color ?? (isDark ? CC.text : CC.lText),
        }}
      >
        {value}
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
          borderRadius: 1,
          overflow: "hidden",
          width: "100%",
          minWidth: 80,
          cursor: "default",
        }}
      >
        {wPct > 0 && (
          <Box sx={{ width: `${wPct}%`, backgroundColor: "#22ac38" }} />
        )}
        {dPct > 0 && (
          <Box sx={{ width: `${dPct}%`, backgroundColor: "#8b91a0" }} />
        )}
        {lPct > 0 && (
          <Box sx={{ width: `${lPct}%`, backgroundColor: "#f73c3c" }} />
        )}
      </Box>
    </Tooltip>
  );
}

function HighlightCard({
  title,
  name,
  sub,
  icon,
  iconColor,
}: {
  title: string;
  name: string;
  sub: string;
  icon: string;
  iconColor: string;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 180,
        p: 2,
        borderRadius: "6px",
        backgroundColor: isDark ? CC.bg2 : CC.lBg1,
        border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
        <Icon icon={icon} width={14} color={iconColor} />
        <Typography
          sx={{
            fontSize: "0.68rem",
            color: isDark ? CC.textMuted : "#8b91a0",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {title}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: isDark ? CC.text : CC.lText,
          lineHeight: 1.3,
          mb: 0.25,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={name}
      >
        {name}
      </Typography>
      <Typography
        sx={{ fontSize: "0.72rem", color: iconColor, fontWeight: 500 }}
      >
        {sub}
      </Typography>
    </Box>
  );
}

function MiniBoard({ fen }: { fen: string }) {
  return (
    <Box
      sx={{
        borderRadius: "4px",
        overflow: "hidden",
        boxShadow: "0 6px 24px rgba(0,0,0,0.7)",
        lineHeight: 0,
      }}
    >
      <Chessboard
        position={fen}
        boardWidth={180}
        arePiecesDraggable={false}
        customLightSquareStyle={{ backgroundColor: "#b8bfc6" }}
        customDarkSquareStyle={{ backgroundColor: "#2c231e" }}
        customBoardStyle={{ borderRadius: "4px" }}
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
            ? isDark
              ? CC.primaryMuted
              : "rgba(172,199,255,0.15)"
            : isDark
              ? CC.bg3
              : CC.lBg3,
          cursor: "pointer",
          transition: "border-color 120ms, background-color 120ms",
          "&:hover": {
            borderColor: CC.primary,
            backgroundColor: isDark
              ? CC.primaryMuted
              : "rgba(172,199,255,0.12)",
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

  // Pre-parse all qualifying games once — moves are all plies, sequential
  const parsedGames = useMemo(() => {
    const result: {
      history: { san: string; after: string }[];
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

      try {
        const parsed = getGameFromPgn(game.pgn);
        result.push({
          history: parsed.history({ verbose: true }) as {
            san: string;
            after: string;
          }[],
          result: r,
        });
      } catch {
        /* skip */
      }
    }
    return result;
  }, [games, player, colorFilter]);

  const { nextMoves, currentFen, totalMatching } = useMemo(() => {
    // Filter to games matching the selected move path (all plies, both colours)
    const matching = parsedGames.filter(({ history }) => {
      for (let i = 0; i < selectedMoves.length; i++) {
        if (i >= history.length || history[i].san !== selectedMoves[i])
          return false;
      }
      return true;
    });

    // FEN after last selected move
    let currentFen = START_FEN;
    if (selectedMoves.length > 0 && matching.length > 0) {
      currentFen =
        matching[0].history[selectedMoves.length - 1]?.after ?? START_FEN;
    }

    // Next move stats (any colour, sequential ply)
    const nextPly = selectedMoves.length;
    const nextMap = new Map<
      string,
      { wins: number; draws: number; losses: number }
    >();
    for (const { history, result } of matching) {
      if (nextPly >= history.length) continue;
      const san = history[nextPly].san;
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
    const prefix = isWhite ? `${moveNum}.` : ply === 1 ? `1…` : "";
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
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const winPct =
    stat.games > 0 ? Math.round((stat.wins / stat.games) * 100) : 0;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1,
        borderBottom: `1px solid ${isDark ? CC.border : CC.lBorder}`,
        "&:last-child": { borderBottom: "none" },
        "&:hover": { backgroundColor: isDark ? CC.bg3 : CC.lBg3 },
      }}
    >
      <Typography
        sx={{
          width: 22,
          flexShrink: 0,
          fontSize: "0.72rem",
          color: isDark ? CC.textMuted : "#a0a09e",
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
            fontSize: "0.8rem",
            color: isDark ? CC.text : CC.lText,
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
          width: 36,
          flexShrink: 0,
          fontSize: "0.72rem",
          color: isDark ? CC.textMuted : "#a0a09e",
          textAlign: "center",
        }}
      >
        {stat.games}
      </Typography>
      <Box sx={{ width: 120, flexShrink: 0 }}>
        <ResultBar {...stat} />
      </Box>
      <Typography
        sx={{
          width: 36,
          flexShrink: 0,
          fontSize: "0.8rem",
          fontWeight: 600,
          textAlign: "right",
          color:
            winPct >= 60
              ? "#22ac38"
              : winPct <= 35
                ? "#f73c3c"
                : isDark
                  ? CC.text
                  : CC.lText,
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
  const { games: dbGames, isReady } = useGameDatabase(true);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [source, setSource] = useState<Source>("database");
  const [chessComGames, setChessComGames] = useState<LoadedGame[] | null>(null);
  const [chessComPlayer, setChessComPlayer] = useState<string>("");

  const handleChessComLoaded = (games: LoadedGame[], username: string) => {
    setChessComGames(games);
    setChessComPlayer(username);
  };

  // Active game list based on source
  const activeGames: SimpleGame[] = useMemo(() => {
    if (source === "chessCom") {
      return toSimpleGames(chessComGames ?? []);
    }
    return toSimpleGames(dbGames);
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
    <Grid
      container
      justifyContent="center"
      sx={{ pt: { xs: 1, lg: 2 }, px: { xs: 1, sm: 2 }, pb: 4 }}
    >
      <PageTitle title="Chesskit Statistics" />

      <Grid container size={12} maxWidth={900} gap={3} direction="column">
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: isDark ? CC.text : CC.lText }}
          >
            Statistics
          </Typography>

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
            {/* Overview cards */}
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <StatCard
                label="Total games"
                value={stats.total}
                icon="streamline:database"
              />
              <StatCard
                label="Wins"
                value={`${winPct}%`}
                icon="mdi:trophy-outline"
                color="#22ac38"
              />
              <StatCard
                label="Draws"
                value={`${drawPct}%`}
                icon="mdi:handshake-outline"
                color="#8b91a0"
              />
              <StatCard
                label="Losses"
                value={`${lossPct}%`}
                icon="mdi:close-circle-outline"
                color="#f73c3c"
              />
              <StatCard
                label="Avg moves"
                value={stats.avgMoves}
                icon="mdi:arrow-right-circle-outline"
              />
            </Box>

            {/* Highlights */}
            {(bestOpening || worstOpening || mostPlayed) && (
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                {bestOpening && (
                  <HighlightCard
                    title="Best opening"
                    name={bestOpening.name}
                    sub={`${Math.round((bestOpening.wins / bestOpening.games) * 100)}% win · ${bestOpening.games} games`}
                    icon="mdi:trophy-outline"
                    iconColor="#22ac38"
                  />
                )}
                {mostPlayed && (
                  <HighlightCard
                    title="Most played"
                    name={mostPlayed.name}
                    sub={`${mostPlayed.games} games`}
                    icon="mdi:fire"
                    iconColor={CC.primary}
                  />
                )}
                {worstOpening && worstOpening.name !== bestOpening?.name && (
                  <HighlightCard
                    title="To improve"
                    name={worstOpening.name}
                    sub={`${Math.round((worstOpening.wins / worstOpening.games) * 100)}% win · ${worstOpening.games} games`}
                    icon="mdi:chart-line-variant"
                    iconColor="#f73c3c"
                  />
                )}
              </Box>
            )}

            {/* Move tree */}
            <MoveBreakdown
              games={activeGames}
              player={resolvedPlayer}
              colorFilter={colorFilter}
            />

            {/* Opening table */}
            <Box
              sx={{
                borderRadius: "6px",
                border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
                overflow: "hidden",
                backgroundColor: isDark ? CC.bg2 : CC.lBg1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1.2,
                  borderBottom: `1px solid ${isDark ? CC.border : CC.lBorder}`,
                  backgroundColor: isDark ? CC.bg3 : CC.lBg2,
                }}
              >
                {[
                  { label: "#", width: 22, align: "right" as const },
                  { label: "Opening", flex: true },
                  { label: "Games", width: 36, align: "center" as const },
                  { label: "Results", width: 120 },
                  { label: "Win%", width: 36, align: "right" as const },
                ].map(({ label, width, flex, align }) => (
                  <Typography
                    key={label}
                    sx={{
                      ...(flex ? { flex: 1 } : { width, flexShrink: 0 }),
                      fontSize: "0.68rem",
                      color: isDark ? CC.textMuted : "#a0a09e",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      textAlign: align,
                    }}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>

              {stats.openingStats.length === 0 ? (
                <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      color: isDark ? CC.textMuted : "#a0a09e",
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
  );
}
