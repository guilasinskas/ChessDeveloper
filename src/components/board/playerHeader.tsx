import { Color } from "@/types/enums";
import { Player } from "@/types/game";
import { Box, Stack, Typography } from "@mui/material";
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
    <Box
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        py: 1.25,
        px: 1.5,
        borderRadius: "var(--cc-radius-lg)",
        backgroundColor: "var(--cc-surface-container-low)",
        boxShadow: "var(--cc-shadow-soft)",
      }}
    >
      <Stack direction="row" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
        {/* Circular avatar — 48px, sage border for the "you" player (white). */}
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: isWhite
              ? `2px solid ${CC.primary}`
              : "2px solid var(--cc-outline-variant)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--cc-surface-container)",
            flexShrink: 0,
          }}
        >
          {player.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={player.avatarUrl}
              alt={player.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Typography
              sx={{
                fontFamily: "var(--cc-font-headline)",
                fontWeight: 700,
                fontSize: 18,
                color: CC.primary,
              }}
            >
              {player.name[0]?.toUpperCase() ?? "?"}
            </Typography>
          )}
        </Box>

        <Stack sx={{ minWidth: 0 }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography
              sx={{
                fontFamily: "var(--cc-font-body)",
                fontSize: 16,
                fontWeight: 700,
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 180,
              }}
            >
              {player.name}
            </Typography>
            {player.rating && (
              <Box
                sx={{
                  backgroundColor: isWhite
                    ? CC.primary
                    : "var(--cc-outline-variant)",
                  color: isWhite ? "var(--cc-on-primary)" : CC.text,
                  px: 0.75,
                  py: 0.125,
                  borderRadius: "4px",
                  fontFamily: "var(--cc-font-body)",
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1.4,
                }}
              >
                {player.rating}
              </Box>
            )}
          </Stack>

          <CapturedPieces fen={gameFen} color={color} />
        </Stack>
      </Stack>

      {clock && (
        <Box
          sx={{
            // Top player (black) gets a dark inverse pill, bottom (white) gets
            // a light bordered pill — matches the Stitch reference.
            backgroundColor: isWhite
              ? "var(--cc-surface-container-highest)"
              : "var(--cc-on-surface)",
            color: isWhite
              ? "var(--cc-on-surface)"
              : "var(--cc-surface)",
            border: isWhite ? "1px solid var(--cc-outline-variant)" : "none",
            borderRadius: "var(--cc-radius-md)",
            px: 1.75,
            py: 0.75,
            minWidth: "6rem",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontFamily: "var(--cc-font-mono)",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.05em",
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {clock.hours ? `${clock.hours}:` : ""}
            {getPaddedNumber(clock.minutes)}:{getPaddedNumber(clock.seconds)}
            {clock.hours || clock.minutes || clock.seconds > 20
              ? ""
              : `.${clock.tenths}`}
          </Typography>
        </Box>
      )}
    </Box>
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
