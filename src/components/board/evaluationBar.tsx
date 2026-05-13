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

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      flexDirection={isWhiteOnBottom ? "column" : "column-reverse"}
      width={{ xs: "1.5rem", sm: "2rem" }}
      height={height}
      sx={{
        border: "1px solid var(--cc-outline-variant)",
        borderRadius: "var(--cc-radius-pill)",
        overflow: "hidden",
        flexShrink: 0,
        backgroundColor: "var(--cc-surface-container-high)",
        boxShadow: "var(--cc-shadow-soft)",
      }}
    >
      {/* Black section */}
      <Box
        sx={{
          backgroundColor: "var(--cc-on-surface)",
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
              color: "var(--cc-surface)",
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
          backgroundColor: "var(--cc-surface)",
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
              color: "var(--cc-on-surface)",
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
