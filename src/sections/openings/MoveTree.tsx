import { Box, IconButton, Tooltip, Typography, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { CC } from "@/constants";
import {
  REPERTOIRE_ROOT_ID,
  deleteSubtree,
  promoteNodeToMainline,
} from "@/lib/repertoireTree";
import { RepertoireNode, RepertoireTree } from "@/types/openings";
import {
  currentNodeIdAtom,
  repertoireTreeAtom,
} from "./states";

interface Props {
  onTreeChange: () => void;
}

interface RenderItem {
  node: RepertoireNode;
  depth: number;
  isVariationStart: boolean;
}

const buildRenderList = (tree: RepertoireTree): RenderItem[] => {
  const items: RenderItem[] = [];

  const walk = (nodeId: string, depth: number, isVariationStart: boolean) => {
    const node = tree.nodes[nodeId];
    if (!node) return;
    if (nodeId !== tree.rootId) {
      items.push({ node, depth, isVariationStart });
    }
    const [first, ...rest] = node.children;
    for (const id of rest) {
      walk(id, depth + 1, true);
    }
    if (first) walk(first, depth, false);
  };

  walk(tree.rootId, 0, false);
  return items;
};

export default function MoveTree({ onTreeChange }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [tree, setTree] = useAtom(repertoireTreeAtom);
  const [currentNodeId, setCurrentNodeId] = useAtom(currentNodeIdAtom);

  const items = useMemo(() => buildRenderList(tree), [tree]);

  const handleClickNode = (id: string) => setCurrentNodeId(id);

  const handleDeleteNode = (id: string) => {
    const { tree: newTree, newCurrentId } = deleteSubtree(tree, id);
    setTree(newTree);
    setCurrentNodeId(newCurrentId);
    onTreeChange();
  };

  const handlePromote = (id: string) => {
    const newTree = promoteNodeToMainline(tree, id);
    setTree(newTree);
    onTreeChange();
  };

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: isDark ? CC.bg2 : CC.lBg1,
        border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: `1px solid ${isDark ? CC.border : CC.lBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: isDark ? CC.bg0 : CC.lBg2,
        }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: isDark ? CC.textMuted : "#a0a09e",
          }}
        >
          Move tree
        </Typography>
        <Tooltip title="Back to start">
          <IconButton
            size="small"
            onClick={() => setCurrentNodeId(REPERTOIRE_ROOT_ID)}
          >
            <Icon icon="material-symbols:first-page" width={16} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        id="moves-panel"
        sx={{
          maxHeight: { xs: 220, md: 380 },
          overflowY: "auto",
          p: 1,
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {items.length === 0 && (
          <Typography
            sx={{
              fontSize: 13,
              color: isDark ? CC.textMuted : "#a0a09e",
              p: 2,
              textAlign: "center",
            }}
          >
            Play moves on the board to start your repertoire.
          </Typography>
        )}

        {items.map(({ node, depth, isVariationStart }) => {
          const isSelected = node.id === currentNodeId;
          const moveNumber = Math.ceil(node.ply / 2);
          const isWhiteMove = node.color === "w";
          const moveLabel = isWhiteMove
            ? `${moveNumber}.`
            : isVariationStart
              ? `${moveNumber}...`
              : "";

          return (
            <Box
              key={node.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                pl: 1 + depth * 1.25,
                pr: 1,
                py: 0.5,
                borderRadius: "6px",
                cursor: "pointer",
                backgroundColor: isSelected
                  ? isDark
                    ? CC.primaryMuted
                    : "rgba(172,199,255,0.15)"
                  : "transparent",
                "&:hover": {
                  backgroundColor: isDark ? CC.bg3 : CC.lBg3,
                  "& .move-actions": { opacity: 1 },
                },
              }}
              onClick={() => handleClickNode(node.id)}
            >
              {moveLabel && (
                <Typography
                  sx={{
                    fontSize: 12,
                    color: isDark ? CC.textMuted : "#8a8480",
                    fontWeight: 500,
                    minWidth: moveNumber > 99 ? 32 : 24,
                  }}
                >
                  {moveLabel}
                </Typography>
              )}

              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected
                    ? CC.primary
                    : isDark
                      ? CC.text
                      : CC.lText,
                  flex: 1,
                  fontFamily: `var(--font-space-grotesk), sans-serif`,
                }}
              >
                {node.san}
                {node.important && (
                  <Box
                    component="span"
                    sx={{ ml: 0.5, color: CC.gold, fontSize: 11 }}
                  >
                    !
                  </Box>
                )}
                {node.comment && (
                  <Box
                    component="span"
                    sx={{
                      ml: 0.5,
                      color: isDark ? CC.textMuted : "#8a8480",
                      fontSize: 11,
                    }}
                  >
                    📝
                  </Box>
                )}
              </Typography>

              <Box
                className="move-actions"
                sx={{
                  display: "flex",
                  gap: 0.25,
                  opacity: isSelected ? 1 : 0,
                  transition: "opacity 100ms ease",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {!node.isMainline && (
                  <Tooltip title="Promote to main line">
                    <IconButton
                      size="small"
                      sx={{ p: 0.25 }}
                      onClick={() => handlePromote(node.id)}
                    >
                      <Icon icon="material-symbols:arrow-upward" width={13} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Delete branch">
                  <IconButton
                    size="small"
                    sx={{ p: 0.25, color: "#c45c5c" }}
                    onClick={() => handleDeleteNode(node.id)}
                  >
                    <Icon icon="mdi:delete-outline" width={13} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
