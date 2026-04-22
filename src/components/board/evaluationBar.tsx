import { Box, Grid2 as Grid, Typography } from "@mui/material";
import { PrimitiveAtom, atom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { getEvaluationBarValue } from "@/lib/chess";
import { Color } from "@/types/enums";
import { CurrentPosition } from "@/types/eval";
import { CC } from "@/constants";

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
  const blackBarPct = isWhiteOnBottom ? 100 - evalBar.whiteBarPercentage : evalBar.whiteBarPercentage;
  const whiteBarPct = isWhiteOnBottom ? evalBar.whiteBarPercentage : 100 - evalBar.whiteBarPercentage;
  const showLabelOnBlack =
    (evalBar.whiteBarPercentage < 50 && isWhiteOnBottom) ||
    (evalBar.whiteBarPercentage >= 50 && !isWhiteOnBottom);

  return (
    // Chess.com eval bar: thin vertical strip beside the board
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      width={{ xs: "1.2rem", sm: "1.5rem" }}
      height={height}
      sx={{
        border: `1px solid ${CC.border}`,
        borderRadius: "2px",
        overflow: "hidden",
        flexShrink: 0,
        backgroundColor: CC.bg0,
      }}
    >
      {/* Black section — top */}
      <Box
        sx={{
          backgroundColor: CC.bg0,
          transition: "height 0.7s ease",
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
        height={`${blackBarPct}%`}
      >
        {showLabelOnBlack && evalBar.whiteBarPercentage !== 50 && (
          <Typography
            sx={{
              color: CC.text,
              fontSize: { xs: "0.6rem", sm: "0.65rem" },
              fontWeight: 700,
              lineHeight: 1,
              mt: "2px",
              userSelect: "none",
            }}
          >
            {evalBar.label}
          </Typography>
        )}
      </Box>

      {/* White section — bottom */}
      <Box
        sx={{
          backgroundColor: CC.text,
          transition: "height 0.7s ease",
          width: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
        height={`${whiteBarPct}%`}
      >
        {!showLabelOnBlack && evalBar.whiteBarPercentage !== 50 && (
          <Typography
            sx={{
              color: CC.bg1,
              fontSize: { xs: "0.6rem", sm: "0.65rem" },
              fontWeight: 700,
              lineHeight: 1,
              mb: "2px",
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
