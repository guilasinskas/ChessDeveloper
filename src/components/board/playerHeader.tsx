import { Color } from "@/types/enums";
import { Player } from "@/types/game";
import { Box, Grid2 as Grid, Stack, Typography, useTheme } from "@mui/material";
import CapturedPieces from "./capturedPieces";
import { PrimitiveAtom, useAtomValue } from "jotai";
import { Chess } from "chess.js";
import { useMemo } from "react";
import { getPaddedNumber } from "@/lib/helpers";
import { CC } from "@/constants";

export interface Props {
  player: Player;
  color: Color;
  gameAtom: PrimitiveAtom<Chess>;
}

export default function PlayerHeader({ color, player, gameAtom }: Props) {
  const game = useAtomValue(gameAtom);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const gameFen = game.fen();

  const clock = useMemo(() => {
    const turn = game.turn();

    if (turn === color) {
      const history = game.history({ verbose: true });
      const previousFen = history.at(-1)?.before;

      const comment = game
        .getComments()
        .find(({ fen }) => fen === previousFen)?.comment;

      return getClock(comment);
    }

    const comment = game.getComment();
    return getClock(comment);
  }, [game, color]);

  const isWhite = color === Color.White;

  return (
    <Grid
      container
      justifyContent="space-between"
      alignItems="center"
      size={12}
    >
      <Stack direction="row" alignItems="center" gap={1}>
        {/* Chess.com avatar: small square with initials, piece-color themed */}
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "4px",
            backgroundColor: isWhite
              ? isDark ? CC.text : "#e8eaf4"
              : isDark ? CC.bg0 : "#1a1c20",
            color: isWhite
              ? isDark ? CC.bg1 : CC.bg1
              : isDark ? CC.text : CC.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {player.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={player.avatarUrl} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            player.name[0]?.toUpperCase() ?? "?"
          )}
        </Box>

        <Stack>
          <Stack direction="row" alignItems="baseline" gap={0.5}>
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, lineHeight: 1.3 }}>
              {player.name}
            </Typography>
            {player.rating && (
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 400, color: "text.secondary", lineHeight: 1.3 }}>
                ({player.rating})
              </Typography>
            )}
          </Stack>

          <CapturedPieces fen={gameFen} color={color} />
        </Stack>
      </Stack>

      {/* Clock display — Chess.com style: dark/light badge */}
      {clock && (
        <Box
          sx={{
            backgroundColor: isWhite
              ? isDark ? CC.text : "#e8eaf4"
              : isDark ? CC.bg0 : "#1a1c20",
            color: isWhite
              ? isDark ? CC.bg1 : CC.bg1
              : isDark ? CC.text : CC.text,
            border: `1px solid ${isWhite ? (isDark ? CC.bg5 : CC.lBorder) : CC.border}`,
            borderRadius: "4px",
            px: "8px",
            py: "3px",
            minWidth: "5rem",
            textAlign: "right",
          }}
        >
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {clock.hours ? `${clock.hours}:` : ""}
            {getPaddedNumber(clock.minutes)}:{getPaddedNumber(clock.seconds)}
            {clock.hours || clock.minutes || clock.seconds > 20
              ? ""
              : `.${clock.tenths}`}
          </Typography>
        </Box>
      )}
    </Grid>
  );
}

const getClock = (comment: string | undefined) => {
  if (!comment) return undefined;

  const match = comment.match(/\[%clk (\d+):(\d+):(\d+)(?:\.(\d*))?\]/);
  if (!match) return undefined;

  return {
    hours: parseInt(match[1]),
    minutes: parseInt(match[2]),
    seconds: parseInt(match[3]),
    tenths: match[4] ? parseInt(match[4]) : 0,
  };
};
