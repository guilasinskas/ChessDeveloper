import { Box, IconButton, Tooltip, Typography, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtomValue, useSetAtom } from "jotai";
import { Fragment } from "react";
import { CC } from "@/constants";
import { RepertoireNode, RepertoireTree } from "@/types/openings";
import { currentNodeIdAtom, repertoireTreeAtom } from "./states";
import {
  deleteRepertoireSubtreeAction,
  goStartRepertoireAction,
  goToRepertoireNodeAction,
  promoteRepertoireNodeAction,
} from "./actions";

interface LineProps {
  startId: string;
  tree: RepertoireTree;
  currentNodeId: string;
  isDark: boolean;
  goToNode: (id: string) => void;
  deleteSubtree: (id: string) => void;
  promote: (id: string) => void;
  depth: number;
  isVariationStart: boolean;
}

interface Segment {
  nodes: RepertoireNode[];
  variationIds: string[];
}

function buildSegments(startId: string, tree: RepertoireTree): Segment[] {
  const segments: Segment[] = [];
  const run: RepertoireNode[] = [];
  let cur: string | undefined = startId;

  while (cur) {
    const node: RepertoireNode | undefined = tree.nodes[cur];
    if (!node) break;
    run.push(node);
    const main: string | undefined = node.children[0];
    const vars: string[] = node.children.slice(1);
    if (vars.length > 0) {
      segments.push({ nodes: [...run], variationIds: vars });
      run.length = 0;
    }
    cur = main;
  }
  if (run.length > 0) segments.push({ nodes: run, variationIds: [] });
  return segments;
}

function MoveLine({
  startId,
  tree,
  currentNodeId,
  isDark,
  goToNode,
  deleteSubtree,
  promote,
  depth,
  isVariationStart,
}: LineProps) {
  const segments = buildSegments(startId, tree);

  return (
    <Box sx={{ lineHeight: 1.9 }}>
      {segments.map((seg, segIdx) => {
        // Black moves show "N..." if this is the first segment of a variation,
        // or any segment after index 0 (which means it follows variation blocks).
        const blackNeedsNumber = segIdx === 0 ? isVariationStart : true;

        return (
          <Fragment key={segIdx}>
            {seg.nodes.map((node, nodeIdx) => {
              const isWhite = node.color === "w";
              const moveNumber = Math.ceil(node.ply / 2);
              const isSelected = node.id === currentNodeId;
              const showNumber = isWhite || (nodeIdx === 0 && blackNeedsNumber);

              return (
                <Box
                  key={node.id}
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    "&:hover .move-actions": { opacity: 1 },
                  }}
                >
                  {showNumber && (
                    <Typography
                      component="span"
                      sx={{
                        fontSize: depth === 0 ? 12 : 11,
                        color: isDark ? CC.textMuted : "#8a8480",
                        fontWeight: 500,
                        mx: 0.3,
                        userSelect: "none",
                      }}
                    >
                      {isWhite ? `${moveNumber}.` : `${moveNumber}...`}
                    </Typography>
                  )}

                  <Box
                    component="span"
                    sx={{
                      px: 0.75,
                      py: 0.15,
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: depth === 0 ? 13 : 12,
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected
                        ? isDark
                          ? CC.text
                          : CC.lText
                        : depth > 0
                          ? isDark
                            ? "#9a9590"
                            : "#6a6660"
                          : isDark
                            ? CC.text
                            : CC.lText,
                      backgroundColor: isSelected
                        ? CC.primaryMuted
                        : "transparent",
                      "&:hover": {
                        backgroundColor: isDark ? CC.bg3 : CC.lBg3,
                      },
                      fontFamily:
                        "var(--cc-font-mono)",
                    }}
                    onClick={() => goToNode(node.id)}
                  >
                    {node.san}
                    {node.important && (
                      <Box
                        component="span"
                        sx={{ color: CC.gold, fontSize: 10, ml: 0.25 }}
                      >
                        !
                      </Box>
                    )}
                    {node.comment && (
                      <Box component="span" sx={{ fontSize: 10, ml: 0.25 }}>
                        📝
                      </Box>
                    )}
                  </Box>

                  {isSelected && (
                    <Box
                      className="move-actions"
                      component="span"
                      sx={{
                        display: "inline-flex",
                        opacity: 1,
                        transition: "opacity 100ms",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!node.isMainline && (
                        <Tooltip title="Promote to main line">
                          <IconButton
                            size="small"
                            sx={{ p: 0.25 }}
                            onClick={() => promote(node.id)}
                          >
                            <Icon
                              icon="material-symbols:arrow-upward"
                              width={12}
                            />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete branch">
                        <IconButton
                          size="small"
                          sx={{ p: 0.25, color: "#c45c5c" }}
                          onClick={() => deleteSubtree(node.id)}
                        >
                          <Icon icon="mdi:delete-outline" width={12} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              );
            })}

            {seg.variationIds.length > 0 && (
              <Box
                sx={{
                  display: "block",
                  ml: depth === 0 ? 1.5 : 1,
                  mt: 0.25,
                  mb: 0.5,
                }}
              >
                {seg.variationIds.map((varId) => (
                  <Box
                    key={varId}
                    sx={{
                      borderLeft: `2px solid ${
                        isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"
                      }`,
                      pl: 1.5,
                      mb: 0.25,
                    }}
                  >
                    <MoveLine
                      startId={varId}
                      tree={tree}
                      currentNodeId={currentNodeId}
                      isDark={isDark}
                      goToNode={goToNode}
                      deleteSubtree={deleteSubtree}
                      promote={promote}
                      depth={depth + 1}
                      isVariationStart={true}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Fragment>
        );
      })}
    </Box>
  );
}

export default function MoveTree() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const tree = useAtomValue(repertoireTreeAtom);
  const currentNodeId = useAtomValue(currentNodeIdAtom);
  const goToNode = useSetAtom(goToRepertoireNodeAction);
  const deleteSubtreeAct = useSetAtom(deleteRepertoireSubtreeAction);
  const promoteAct = useSetAtom(promoteRepertoireNodeAction);
  const goStart = useSetAtom(goStartRepertoireAction);

  const firstChildId = tree.nodes[tree.rootId]?.children[0];

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
          <IconButton size="small" onClick={() => goStart()}>
            <Icon icon="material-symbols:first-page" width={16} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        id="moves-panel"
        sx={{
          maxHeight: { xs: 220, md: 380 },
          overflowY: "auto",
          p: 1.5,
        }}
      >
        {!firstChildId ? (
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
        ) : (
          <MoveLine
            startId={firstChildId}
            tree={tree}
            currentNodeId={currentNodeId}
            isDark={isDark}
            goToNode={goToNode}
            deleteSubtree={deleteSubtreeAct}
            promote={promoteAct}
            depth={0}
            isVariationStart={false}
          />
        )}
      </Box>
    </Box>
  );
}
