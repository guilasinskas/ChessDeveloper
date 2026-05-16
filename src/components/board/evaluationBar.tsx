import { Box, Grid2 as Grid, Typography } from "@mui/material";
import { PrimitiveAtom, atom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { getEvaluationBarValue } from "@/lib/chess";
import { Color } from "@/types/enums";
import { CurrentPosition } from "@/types/eval";

interface Props {
  height: number;
  boardOrientation?: Color;
  currentPositionAtom?: PrimitiveAtom<CurrentPosition>;
}

export default function EvaluationBar({
  height,
  boardOrientation,
  currentPositionAtom = atom({}),
}: Props) {
  const [evalBar, setEvalBar] = useState({
    whiteBarPercentage: 50,
    label: "0.0",
  });
  const position = useAtomValue(currentPositionAtom);

  useEffect(() => {
    const bestLine = position?.eval?.lines[0];
    if (!position.eval || !bestLine || bestLine.depth < 6) return;

    const evalBar = getEvaluationBarValue(position.eval);
    setEvalBar(evalBar);
  }, [position]);

  const isWhiteOnBottom = boardOrientation === Color.White;
  const whiteIsWinning = evalBar.whiteBarPercentage > 50;
  const blackIsWinning = evalBar.whiteBarPercentage < 50;
  const showLabel = evalBar.whiteBarPercentage !== 50;

  // The eval bar represents White vs Black PIECES — its colors must NOT
  // flip with the UI theme. Hardcoded so the "black" side is always dark
  // and the "white" side is always light, matching every other chess UI
  // (lichess, chess.com, etc.). Theme tokens that invert under dark mode
  // would make the bar visually confusing.
  const BLACK_SIDE = "#262421";
  const WHITE_SIDE = "#f0ece0";

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      flexDirection={isWhiteOnBottom ? "column" : "column-reverse"}
      width={{ xs: "1.5rem", sm: "2rem" }}
      height={height}
      sx={{
        border: "1px solid rgba(0, 0, 0, 0.2)",
        borderRadius: "var(--cc-radius-pill)",
        overflow: "hidden",
        flexShrink: 0,
        backgroundColor: BLACK_SIDE,
        boxShadow: "var(--cc-shadow-soft)",
      }}
    >
      {/* Black section */}
      <Box
        sx={{
          backgroundColor: BLACK_SIDE,
          transition: "height 0.7s ease",
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
        height={`${100 - evalBar.whiteBarPercentage}%`}
      >
        {blackIsWinning && showLabel && (
          <Typography
            sx={{
              color: WHITE_SIDE,
              fontFamily: "var(--cc-font-mono)",
              fontSize: { xs: "0.6rem", sm: "0.7rem" },
              fontWeight: 700,
              lineHeight: 1,
              mt: "4px",
              userSelect: "none",
            }}
          >
            {evalBar.label}
          </Typography>
        )}
      </Box>

      {/* White section */}
      <Box
        sx={{
          backgroundColor: WHITE_SIDE,
          transition: "height 0.7s ease",
          width: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
        height={`${evalBar.whiteBarPercentage}%`}
      >
        {whiteIsWinning && showLabel && (
          <Typography
            sx={{
              color: BLACK_SIDE,
              fontFamily: "var(--cc-font-mono)",
              fontSize: { xs: "0.6rem", sm: "0.7rem" },
              fontWeight: 700,
              lineHeight: 1,
              mb: "4px",
              userSelect: "none",
            }}
          >
            {evalBar.label}
          </Typography>
        )}
      </Box>
    </Grid>
  );
}
