import { useEffect, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  clockBlackAtom,
  clockWhiteAtom,
  gameAtom,
  isGameInProgressAtom,
  timeControlAtom,
} from "./states";
import { Box, Typography, useTheme } from "@mui/material";
import { CC } from "@/constants";
import { Color } from "@/types/enums";

export function formatClkAnnotation(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `[%clk ${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}]`;
}

function formatDisplay(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ClockFace({
  seconds,
  active,
  label,
}: {
  seconds: number;
  active: boolean;
  label: string;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isLow = seconds > 0 && seconds < 30;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        px: 2,
        py: 1,
        borderRadius: "4px",
        backgroundColor: active ? (isDark ? CC.bg3 : CC.lBg3) : "transparent",
        border: `1px solid ${active ? CC.primary : isDark ? CC.border : CC.lBorder}`,
        transition: "background-color 200ms, border-color 200ms",
      }}
    >
      <Typography
        sx={{
          fontSize: "0.75rem",
          color: isDark ? CC.textMuted : "#8b91a0",
          userSelect: "none",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "1.5rem",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          color: isLow
            ? "#f73c3c"
            : active
              ? isDark
                ? CC.text
                : CC.lText
              : isDark
                ? CC.textMuted
                : "#8b91a0",
          userSelect: "none",
        }}
      >
        {formatDisplay(seconds)}
      </Typography>
    </Box>
  );
}

interface Props {
  playerColor: Color;
}

export default function ChessClocks({ playerColor }: Props) {
  const game = useAtomValue(gameAtom);
  const isGameInProgress = useAtomValue(isGameInProgressAtom);
  const setIsGameInProgress = useSetAtom(isGameInProgressAtom);
  const timeControl = useAtomValue(timeControlAtom);
  const [clockWhite, setClockWhite] = useAtom(clockWhiteAtom);
  const [clockBlack, setClockBlack] = useAtom(clockBlackAtom);
  const timedOutRef = useRef(false);

  const gameFen = game.fen();
  const activeTurn = game.turn();
  const isGameOver = game.isGameOver();
  const isRunning = isGameInProgress && !isGameOver && timeControl !== null;

  // Countdown effect — re-runs when the active turn changes
  useEffect(() => {
    if (!isRunning) return;
    timedOutRef.current = false;

    const interval = setInterval(() => {
      if (activeTurn === "w") {
        setClockWhite((prev) => Math.max(0, (prev ?? 0) - 1));
      } else {
        setClockBlack((prev) => Math.max(0, (prev ?? 0) - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameFen, isRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timeout detection
  useEffect(() => {
    if (!isRunning || timedOutRef.current) return;
    if (activeTurn === "w" && clockWhite === 0) {
      timedOutRef.current = true;
      setIsGameInProgress(false);
    } else if (activeTurn === "b" && clockBlack === 0) {
      timedOutRef.current = true;
      setIsGameInProgress(false);
    }
  }, [clockWhite, clockBlack, activeTurn, isRunning, setIsGameInProgress]);

  if (!timeControl || clockWhite === null || clockBlack === null) return null;

  const isWhiteActive = activeTurn === "w" && isRunning;
  const isBlackActive = activeTurn === "b" && isRunning;

  const blackLabel = playerColor === Color.Black ? "You" : "Opponent";
  const whiteLabel = playerColor === Color.White ? "You" : "Opponent";

  return (
    <Box
      sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}
    >
      <ClockFace
        seconds={clockBlack}
        active={isBlackActive}
        label={blackLabel}
      />
      <ClockFace
        seconds={clockWhite}
        active={isWhiteActive}
        label={whiteLabel}
      />
    </Box>
  );
}
