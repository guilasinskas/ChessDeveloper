import { getCapturedPieces, getMaterialDifference } from "@/lib/chess";
import { Color } from "@/types/enums";
import { Box, Stack, Typography } from "@mui/material";
import { ReactElement, useMemo } from "react";

export interface Props {
  fen: string;
  color: Color;
}

const PIECE_SCALE = 0.55;

export default function CapturedPieces({ fen, color }: Props) {
  const piecesComponents = useMemo(() => {
    const capturedPieces = getCapturedPieces(fen, color);
    return capturedPieces.map(({ piece, count }) =>
      getCapturedPiecesComponents(piece, count)
    );
  }, [fen, color]);

  const materialDiff = useMemo(() => {
    const materialDiff = getMaterialDifference(fen);
    return color === Color.White ? materialDiff : -materialDiff;
  }, [fen, color]);

  return (
    <Box
      sx={{
        // Fixed height — always reserved, whether or not pieces have been
        // captured yet. Without this the row collapses to 0 until the first
        // capture, the player-header column grows, the page overflows 100vh
        // and a scrollbar appears. The board sizing hook is now viewport-
        // anchored and ignores main.clientWidth, so a one-off scrollbar no
        // longer resizes the board — but keeping the height stable here
        // also avoids the visible layout jump on first capture.
        height: `${2 * PIECE_SCALE}rem`,
        display: "flex",
        alignItems: "center",
        marginLeft: `-${0.3 * PIECE_SCALE}rem`,
        gap: "0.35rem",
      }}
    >
      <Stack direction="row" spacing={0.1}>
        {piecesComponents}
      </Stack>

      {materialDiff > 0 && (
        <Typography
          lineHeight={`${PIECE_SCALE * 1.5}rem`}
          fontSize={`${PIECE_SCALE * 1.5}rem`}
        >
          +{materialDiff}
        </Typography>
      )}
    </Box>
  );
}

const getCapturedPiecesComponents = (
  pieceSymbol: string,
  pieceCount: number | undefined
): ReactElement | null => {
  if (!pieceCount) return null;

  return (
    <Stack
      direction="row"
      key={pieceSymbol}
      spacing={`-${1.2 * PIECE_SCALE}rem`}
    >
      {new Array(pieceCount).fill(0).map((_, index) => (
        <Box
          key={`${pieceSymbol}-${index}`}
          width={`${2 * PIECE_SCALE}rem`}
          height={`${2 * PIECE_SCALE}rem`}
          sx={{
            backgroundImage: `url(/piece/cardinal/${pieceSymbol}.svg)`,
            backgroundRepeat: "no-repeat",
          }}
        />
      ))}
    </Stack>
  );
};
