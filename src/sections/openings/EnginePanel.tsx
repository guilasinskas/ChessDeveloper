import { Box, Typography, useTheme } from "@mui/material";
import { Chess } from "chess.js";
import { useAtomValue } from "jotai";
import { CC } from "@/constants";
import { LineEval } from "@/types/eval";
import { repertoireBoardAtom, repertoireCurrentPositionAtom } from "./states";

function formatEval(line: LineEval, sideToMove: "w" | "b"): string {
  if (line.mate !== undefined) {
    const val = sideToMove === "w" ? line.mate : -line.mate;
    return val > 0 ? `+M${Math.abs(val)}` : `-M${Math.abs(val)}`;
  }
  if (line.cp !== undefined) {
    const cp = sideToMove === "w" ? line.cp : -line.cp;
    const str = (cp / 100).toFixed(1);
    return cp >= 0 ? `+${str}` : str;
  }
  return "0.0";
}

function getSanLine(fen: string, pv: string[], maxMoves = 8): string {
  const chess = new Chess(fen);
  const parts: string[] = [];
  let first = true;
  for (const uci of pv.slice(0, maxMoves)) {
    try {
      const isWhite = chess.turn() === "w";
      const moveNum = chess.moveNumber();
      const move = chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci[4] || undefined,
      });
      if (isWhite) parts.push(`${moveNum}.`);
      else if (first) parts.push(`${moveNum}...`);
      parts.push(move.san);
      first = false;
    } catch {
      break;
    }
  }
  return parts.join(" ");
}

export default function EnginePanel() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const position = useAtomValue(repertoireCurrentPositionAtom);
  const board = useAtomValue(repertoireBoardAtom);
  const evalData = position.eval;
  const fen = board.fen();
  const sideToMove = board.turn();

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: isDark ? CC.bg2 : CC.lBg1,
        border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: `1px solid ${isDark ? CC.border : CC.lBorder}`,
          backgroundColor: isDark ? CC.bg0 : CC.lBg2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: isDark ? CC.textMuted : "#a0a09e",
            flex: 1,
          }}
        >
          Engine
        </Typography>
        {evalData && (
          <Typography
            sx={{
              fontSize: 11,
              color: isDark ? CC.textMuted : "#a0a09e",
            }}
          >
            depth {evalData.lines[0]?.depth ?? 0}
          </Typography>
        )}
      </Box>

      <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
        {!evalData || evalData.lines.length === 0 ? (
          <Typography
            sx={{
              fontSize: 12,
              color: isDark ? CC.textMuted : "#a0a09e",
              textAlign: "center",
              py: 1,
            }}
          >
            Analyzing…
          </Typography>
        ) : (
          evalData.lines.map((line, i) => {
            const evalLabel = formatEval(line, sideToMove);
            const isPositive = evalLabel.startsWith("+");
            const sanLine = getSanLine(fen, line.pv);

            return (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 1,
                  py: 0.4,
                  px: 0.75,
                  borderRadius: "4px",
                  backgroundColor:
                    i === 0
                      ? isDark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(0,0,0,0.03)"
                      : "transparent",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    minWidth: 42,
                    color: isPositive
                      ? isDark
                        ? "#7ecf8e"
                        : "#3a8a4a"
                      : evalLabel.startsWith("-")
                        ? "#c45c5c"
                        : isDark
                          ? CC.textSub
                          : CC.lTextSub,
                  }}
                >
                  {evalLabel}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: isDark ? CC.textSub : CC.lTextSub,
                    fontFamily:
                      "var(--cc-font-mono)",
                    lineHeight: 1.5,
                    flex: 1,
                    wordBreak: "break-word",
                  }}
                >
                  {sanLine}
                </Typography>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
