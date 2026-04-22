import Board from "@/sections/analysis/board";
import PanelHeader from "@/sections/analysis/panelHeader";
import PanelToolBar from "@/sections/analysis/panelToolbar";
import AnalysisTab from "@/sections/analysis/panelBody/analysisTab";
import ClassificationTab from "@/sections/analysis/panelBody/classificationTab";
import { boardAtom, gameAtom, gameEvalAtom } from "@/sections/analysis/states";
import {
  Box,
  Divider,
  Grid2 as Grid,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import EngineSettingsButton from "@/sections/engineSettings/engineSettingsButton";
import GraphTab from "@/sections/analysis/panelBody/graphTab";
import { PageTitle } from "@/components/pageTitle";
import { CC } from "@/constants";

export default function GameAnalysis() {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const isLgOrGreater = useMediaQuery(theme.breakpoints.up("lg"));
  const isDark = theme.palette.mode === "dark";

  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);

  const showMovesTab = game.history().length > 0 || board.history().length > 0;

  useEffect(() => {
    if (tab === 1 && !showMovesTab) setTab(0);
    if (tab === 2 && !gameEval) setTab(0);
  }, [showMovesTab, gameEval, tab]);

  return (
    <Grid
      container
      gap={2}
      justifyContent="space-evenly"
      alignItems="start"
      sx={{ pt: { xs: 1, lg: 2 }, px: { xs: 1, sm: 2 } }}
    >
      <PageTitle title="Chesskit Game Analysis" />

      <Board />

      {/* Analysis panel */}
      <Grid
        container
        justifyContent="start"
        alignItems="center"
        sx={{
          backgroundColor: isDark ? CC.bg2 : CC.lBg1,
          borderRadius: "6px",
          border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
          boxShadow: isDark
            ? "0 2px 8px rgba(0,0,0,0.5)"
            : "0 1px 4px rgba(0,0,0,0.1)",
          overflow: "hidden",
          maxWidth: 1200,
        }}
        padding={{ xs: "8px 6px 16px", sm: "12px 12px 16px" }}
        rowGap={1}
        height={{ xs: tab === 1 ? "40rem" : "auto", lg: "calc(95vh - 72px)" }}
        display="flex"
        flexDirection="column"
        flexWrap="nowrap"
        size={{ xs: 12, lg: "grow" }}
      >
        {isLgOrGreater ? (
          <Box width="100%">
            <PanelHeader key="analysis-panel-header" />
            <Divider sx={{ mx: "4%", mt: 2 }} />
          </Box>
        ) : (
          <PanelToolBar key="review-panel-toolbar" />
        )}

        {!isLgOrGreater && !gameEval && <Divider sx={{ mx: "4%" }} />}
        {!isLgOrGreater && !gameEval && (
          <PanelHeader key="analysis-panel-header" />
        )}

        {!isLgOrGreater && (
          <Box width="100%" sx={{ borderBottom: `1px solid ${isDark ? CC.border : CC.lBorder}` }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="fullWidth"
              sx={{ minHeight: 0 }}
            >
              {[
                { label: "Analysis", icon: "mdi:magnify", id: "tab0" },
                { label: "Moves", icon: "mdi:format-list-bulleted", id: "tab1", hidden: !showMovesTab },
                { label: "Graph", icon: "mdi:chart-line", id: "tab2", hidden: !gameEval },
              ].map(({ label, icon, id, hidden }) => (
                <Tab
                  key={id}
                  label={label}
                  id={id}
                  icon={<Icon icon={icon} height={13} />}
                  iconPosition="start"
                  sx={{
                    textTransform: "none",
                    minHeight: 36,
                    padding: "4px 0 10px",
                    fontSize: 12,
                    display: hidden ? "none" : undefined,
                  }}
                  disableFocusRipple
                />
              ))}
            </Tabs>
          </Box>
        )}

        <GraphTab role="tabpanel" hidden={tab !== 2 && !isLgOrGreater} id="tabContent2" />
        <AnalysisTab role="tabpanel" hidden={tab !== 0 && !isLgOrGreater} id="tabContent0" />
        <ClassificationTab role="tabpanel" hidden={tab !== 1 && !isLgOrGreater} id="tabContent1" />

        {isLgOrGreater && (
          <Box width="100%">
            <Divider sx={{ mx: "4%", mb: 1 }} />
            <PanelToolBar key="review-panel-toolbar" />
          </Box>
        )}

        {!isLgOrGreater && gameEval && (
          <Box width="100%">
            <Divider sx={{ mx: "4%", mb: 2 }} />
            <PanelHeader key="analysis-panel-header" />
          </Box>
        )}
      </Grid>

      <EngineSettingsButton />
    </Grid>
  );
}
