import { Box, Stack, Typography } from "@mui/material";
import { CC } from "@/constants";
import { useTheme } from "@mui/material";

interface Props {
  title: string;
  whiteValue: string | number;
  blackValue: string | number;
}

export default function PlayersMetric({ title, whiteValue, blackValue }: Props) {
  return (
    <Stack
      direction="row"
      justifyContent="center"
      alignItems="center"
      columnGap={{ xs: "6vw", md: 8 }}
    >
      <ValueBlock value={whiteValue} color="white" />

      <Typography
        align="center"
        sx={{
          fontSize: "0.75rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.6px",
          color: "text.secondary",
        }}
        noWrap
      >
        {title}
      </Typography>

      <ValueBlock value={blackValue} color="black" />
    </Stack>
  );
}

const ValueBlock = ({
  value,
  color,
}: {
  value: string | number;
  color: "white" | "black";
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isBlack = color === "black";

  return (
    <Box
      sx={{
        backgroundColor: isBlack ? CC.bg0 : CC.text,
        color: isBlack ? CC.text : CC.bg1,
        border: `1px solid ${isBlack ? CC.border : CC.bg5}`,
        borderRadius: "2px",
        px: "8px",
        py: "4px",
        minWidth: "4rem",
        textAlign: "center",
        borderLeft: `3px solid ${isBlack ? (isDark ? CC.bg5 : "#40444e") : (isDark ? CC.bg5 : "#c4c8d8")}`,
      }}
    >
      <Typography
        sx={{
          fontSize: "0.85rem",
          fontWeight: 700,
          lineHeight: 1.3,
          color: "inherit",
        }}
        noWrap
      >
        {value}
      </Typography>
    </Box>
  );
};
