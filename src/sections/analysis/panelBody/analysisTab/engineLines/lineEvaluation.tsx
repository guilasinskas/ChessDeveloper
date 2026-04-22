import { LineEval } from "@/types/eval";
import { Box, ListItem, Skeleton, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { boardAtom } from "../../../states";
import { getLineEvalLabel, moveLineUciToSan } from "@/lib/chess";
import PrettyMoveSan from "@/components/prettyMoveSan";
import { CC } from "@/constants";
import { useAnalysisActions } from "@/hooks/useAnalysisActions";

interface Props {
  line: LineEval;
}

export default function LineEvaluation({ line }: Props) {
  const board = useAtomValue(boardAtom);
  const { addMoves } = useAnalysisActions();
  const lineLabel = getLineEvalLabel(line);

  const isBlackCp =
    (line.cp !== undefined && line.cp < 0) ||
    (line.mate !== undefined && line.mate < 0);

  const showSkeleton = line.depth < 6;

  const uciToSan = moveLineUciToSan(board.fen());
  const turn = board.turn();

  const getColorFromMoveIdx = (moveIdx: number): "w" | "b" => {
    const moveColor = moveIdx % 2 === 0 ? turn : turn === "w" ? "b" : "w";
    return moveColor;
  };

  return (
    <ListItem disablePadding sx={{ mb: "2px" }}>
      {/* Chess.com eval badge: black bg for black advantage, white bg for white */}
      <Box
        sx={{
          minWidth: "3.2em",
          width: "3.2em",
          mr: 1.5,
          my: "2px",
          py: "2px",
          textAlign: "center",
          borderRadius: "2px",
          backgroundColor: isBlackCp ? CC.bg0 : CC.text,
          border: `1px solid ${isBlackCp ? CC.border : CC.bg5}`,
          flexShrink: 0,
        }}
      >
        {showSkeleton ? (
          <Skeleton
            variant="rounded"
            animation="wave"
            sx={{ color: "transparent", mx: "2px" }}
          />
        ) : (
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: isBlackCp ? CC.text : CC.bg1,
              lineHeight: 1.4,
            }}
          >
            {lineLabel}
          </Typography>
        )}
      </Box>

      <Typography noWrap fontSize="0.82rem" sx={{ color: "text.primary" }}>
        {showSkeleton ? (
          <Skeleton variant="rounded" animation="wave" width="18em" />
        ) : (
          line.pv.map((uci, i) => {
            const san = uciToSan(uci);
            const moveColor = getColorFromMoveIdx(i);

            return (
              <PrettyMoveSan
                key={i}
                san={san}
                color={moveColor}
                additionalText={i < line.pv.length - 1 ? " " : ""}
                boxProps={{
                  onClick: () => addMoves(line.pv.slice(0, i + 1)),
                  sx: {
                    cursor: "pointer",
                    ml: i ? 0.25 : 0,
                    transition: "opacity 80ms ease",
                    "&:hover": { opacity: 0.6 },
                  },
                }}
              />
            );
          })
        )}
      </Typography>
    </ListItem>
  );
}
