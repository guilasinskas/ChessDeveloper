import type React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import { LoadedGame } from "@/types/game";
import { CC } from "@/constants";

interface Props {
  game: LoadedGame;
  onClick: () => void;
  perspectiveUserColor: "white" | "black";
}

export const GameItem: React.FC<Props> = ({
  game,
  onClick,
  perspectiveUserColor,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { white, black, result, timeControl, date, movesNb } = game;

  const userWon =
    (result === "1-0" && perspectiveUserColor === "white") ||
    (result === "0-1" && perspectiveUserColor === "black");
  const userLost =
    (result === "1-0" && perspectiveUserColor === "black") ||
    (result === "0-1" && perspectiveUserColor === "white");
  const isDraw = result === "1/2-1/2";

  const movesNbDisplay = movesNb
    ? `${Math.ceil(movesNb / 2)} moves`
    : undefined;

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2.5,
        mb: 1.5,
        backgroundColor: "var(--cc-surface-container-lowest)",
        border: `1px solid ${CC.border}`,
        borderRadius: "var(--cc-radius-lg)",
        cursor: "pointer",
        transition: "border-color 150ms, box-shadow 150ms, transform 150ms",
        "&:hover": {
          borderColor: CC.primary,
          boxShadow: "var(--cc-shadow-soft)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 1,
          mb: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            minWidth: 0,
            flexWrap: "wrap",
          }}
        >
          <PlayerLabel
            name={formatPlayerName(white)}
            rating={white.rating}
            isUser={perspectiveUserColor === "white"}
          />
          <Typography
            component="span"
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: isDark ? CC.textMuted : "#a0a09e",
            }}
          >
            vs
          </Typography>
          <PlayerLabel
            name={formatPlayerName(black)}
            rating={black.rating}
            isUser={perspectiveUserColor === "black"}
          />
        </Box>

        <Box
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: "var(--cc-radius-sm)",
            backgroundColor: userWon
              ? CC.primaryMuted
              : userLost
                ? "var(--cc-error-container)"
                : isDraw
                  ? "var(--cc-surface-container-high)"
                  : "var(--cc-surface-container)",
            color: userWon
              ? CC.primary
              : userLost
                ? "var(--cc-on-error-container, #93000a)"
                : "var(--cc-on-surface-variant)",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontFamily: "var(--cc-font-mono)",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
            }}
          >
            {result?.replace("1/2-1/2", "½–½") ?? "—"}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          color: isDark ? CC.textMuted : "#8a8a8a",
        }}
      >
        {timeControl && (
          <MetaItem icon="material-symbols:timer-outline" label={timeControl} />
        )}
        {movesNbDisplay && (
          <MetaItem icon="heroicons:hashtag-20-solid" label={movesNbDisplay} />
        )}
        {date && (
          <Box sx={{ ml: "auto" }}>
            <MetaItem icon="material-symbols:calendar-today" label={date} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

interface PlayerLabelProps {
  name: string;
  rating?: number;
  isUser: boolean;
}

function PlayerLabel({ name, rating, isUser }: PlayerLabelProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Typography
      component="span"
      sx={{
        fontSize: 13,
        fontWeight: isUser ? 800 : 600,
        color: isUser ? CC.primary : isDark ? CC.textSub : CC.lTextSub,
        textDecoration: isUser ? "underline" : "none",
        textDecorationColor: isUser ? `${CC.primary}40` : undefined,
        textDecorationThickness: isUser ? 2 : undefined,
        textUnderlineOffset: isUser ? "4px" : undefined,
        whiteSpace: "nowrap",
      }}
    >
      {name}
      {rating ? ` (${rating})` : ""}
    </Typography>
  );
}

interface MetaItemProps {
  icon: string;
  label: string;
}

function MetaItem({ icon, label }: MetaItemProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Icon icon={icon} width={12} />
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          lineHeight: 1.2,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

const formatPlayerName = (player: LoadedGame["white"]) => {
  return player.title ? `${player.title} ${player.name}` : player.name;
};
