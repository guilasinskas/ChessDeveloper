import { PageTitle } from "@/components/pageTitle";
import Board from "@/sections/play/board";
import ChessClocks from "@/sections/play/ChessClocks";
import GameInProgress from "@/sections/play/gameInProgress";
import GameRecap from "@/sections/play/gameRecap";
import GameSettingsButton from "@/sections/play/gameSettings/gameSettingsButton";
import { isGameInProgressAtom, playerColorAtom } from "@/sections/play/states";
import { Grid2 as Grid } from "@mui/material";
import { useAtomValue } from "jotai";
import { useTheme } from "@mui/material";
import { CC } from "@/constants";

export default function Play() {
  const isGameInProgress = useAtomValue(isGameInProgressAtom);
  const playerColor = useAtomValue(playerColorAtom);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Grid
      container
      gap={2}
      justifyContent="space-evenly"
      alignItems="start"
      sx={{ pt: { xs: 1, lg: 2 }, px: { xs: 1, sm: 2 } }}
    >
      <PageTitle title="Chesskit Play vs Stockfish" />

      <Board />

      <Grid
        container
        marginTop={{ xs: 0, md: "2.5em" }}
        justifyContent="center"
        alignItems="center"
        size={{ xs: 12, md: "grow" }}
        sx={{
          backgroundColor: isDark ? CC.bg2 : CC.lBg1,
          borderRadius: "6px",
          border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
          boxShadow: isDark
            ? "0 2px 8px rgba(0,0,0,0.5)"
            : "0 1px 4px rgba(0,0,0,0.1)",
          maxWidth: 400,
          overflow: "hidden",
        }}
        padding={2.5}
        rowGap={2}
      >
        <ChessClocks playerColor={playerColor} />
        <GameInProgress />
        {!isGameInProgress && <GameSettingsButton />}
        <GameRecap />
      </Grid>
    </Grid>
  );
}
