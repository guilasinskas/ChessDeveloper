import { AnalysisNode, AnalysisTree } from "@/types/analysis";
import { MoveClassification } from "@/types/enums";
import {
  Box,
  Grid2 as Grid,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";
import MoveItem from "./moveItem";
import MoveComment from "./moveComment";
import { Icon } from "@iconify/react";
import { Fragment, useMemo, useState } from "react";
import { CC } from "@/constants";
import { getCommentDisplay } from "@/lib/chess";

interface Props {
  commentMap: Map<string, string>;
  gameEvalPositions?: {
    moveClassification?: MoveClassification;
  }[];
  indent?: number;
  onEditComment?: (moveIdx: number, text: string) => void;
  startNodeId: string;
  tree: AnalysisTree;
}

interface DisplayMove {
  node: AnalysisNode;
  moveClassification?: MoveClassification;
  comment?: string;
}

export default function MovesBranch({
  commentMap,
  gameEvalPositions,
  indent = 0,
  onEditComment,
  startNodeId,
  tree,
}: Props) {
  const rows = useMemo(() => {
    const items: { white?: DisplayMove; black?: DisplayMove }[] = [];
    let cursorId: string | undefined = startNodeId;

    while (cursorId) {
      const firstNode: AnalysisNode | undefined = tree.nodes[cursorId];
      if (!firstNode) break;

      if (firstNode.color === "w") {
        const white = buildDisplayMove(
          firstNode,
          commentMap,
          gameEvalPositions
        );
        const blackId: string | undefined = firstNode.children[0];
        const blackNode: AnalysisNode | undefined = blackId
          ? tree.nodes[blackId]
          : undefined;

        if (blackNode?.color === "b") {
          items.push({
            white,
            black: buildDisplayMove(blackNode, commentMap, gameEvalPositions),
          });
          cursorId = blackNode.children[0];
        } else {
          items.push({ white });
          cursorId = firstNode.children[0];
        }
        continue;
      }

      items.push({
        black: buildDisplayMove(firstNode, commentMap, gameEvalPositions),
      });
      cursorId = firstNode.children[0];
    }

    return items;
  }, [commentMap, gameEvalPositions, startNodeId, tree]);

  return (
    <>
      {rows.map((row, idx) => (
        <Fragment
          key={`${row.white?.node.id ?? "none"}-${row.black?.node.id ?? "none"}-${idx}`}
        >
          <MovesLine
            blackMove={row.black}
            commentMap={commentMap}
            gameEvalPositions={gameEvalPositions}
            indent={indent}
            onEditComment={onEditComment}
            tree={tree}
            whiteMove={row.white}
          />
        </Fragment>
      ))}
    </>
  );
}

function MovesLine({
  blackMove,
  commentMap,
  gameEvalPositions,
  indent,
  onEditComment,
  tree,
  whiteMove,
}: {
  blackMove?: DisplayMove;
  commentMap: Map<string, string>;
  gameEvalPositions?: {
    moveClassification?: MoveClassification;
  }[];
  indent: number;
  onEditComment?: (moveIdx: number, text: string) => void;
  tree: AnalysisTree;
  whiteMove?: DisplayMove;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [editingMoveIdx, setEditingMoveIdx] = useState<number | null>(null);

  const moveLabel = whiteMove
    ? `${Math.ceil(whiteMove.node.ply / 2)}.`
    : blackMove
      ? `${Math.ceil(blackMove.node.ply / 2)}...`
      : "";

  const whiteVariationIds = whiteMove
    ? tree.nodes[whiteMove.node.id].children.slice(1)
    : [];
  const blackVariationIds = blackMove
    ? tree.nodes[blackMove.node.id].children.slice(1)
    : [];

  const hasAnyComment = !!whiteMove?.comment || !!blackMove?.comment;
  const hasAnyVariation =
    whiteVariationIds.length > 0 || blackVariationIds.length > 0;
  const showDetailsSection =
    hasAnyVariation ||
    (!!onEditComment && (hasAnyComment || editingMoveIdx !== null));

  return (
    <Grid container size={12}>
      <Grid
        container
        alignItems="center"
        wrap="nowrap"
        size={12}
        sx={{
          minHeight: 28,
          pl: `${indent * 1.25}rem`,
          borderBottom: `1px solid ${isDark ? CC.border : CC.lBorder}`,
        }}
      >
        <Typography
          sx={{
            width: "2.2rem",
            minWidth: "2.2rem",
            fontSize: "0.78rem",
            color: isDark ? CC.textMuted : "#a0a09e",
            fontWeight: 500,
            px: "6px",
            py: "4px",
            flexShrink: 0,
            userSelect: "none",
          }}
        >
          {moveLabel}
        </Typography>

        {whiteMove ? (
          <MoveItem
            moveClassification={whiteMove.moveClassification}
            moveColor="w"
            nodeId={whiteMove.node.id}
            ply={whiteMove.node.ply}
            san={whiteMove.node.san ?? ""}
          />
        ) : (
          <Box sx={{ flexGrow: 1, flexBasis: 0 }} />
        )}

        {blackMove ? (
          <MoveItem
            moveClassification={blackMove.moveClassification}
            moveColor="b"
            nodeId={blackMove.node.id}
            ply={blackMove.node.ply}
            san={blackMove.node.san ?? ""}
          />
        ) : (
          <Box sx={{ flexGrow: 1, flexBasis: 0 }} />
        )}

        {onEditComment && whiteMove?.node.isMainline && (
          <IconButton
            className="add-comment-btn"
            size="small"
            onClick={() => setEditingMoveIdx(whiteMove.node.ply)}
            sx={{
              p: "2px",
              opacity: 0,
              transition: "opacity 80ms ease",
              flexShrink: 0,
              borderRadius: "2px",
              color: isDark ? CC.textMuted : "#a0a09e",
              "&:hover": { color: isDark ? CC.text : CC.lText },
            }}
          >
            <Icon icon="material-symbols:add-comment-outline" width={13} />
          </IconButton>
        )}
      </Grid>

      {showDetailsSection && (
        <Grid
          container
          size={12}
          sx={{
            pl: `calc(2.2rem + ${indent * 1.25}rem)`,
            backgroundColor: isDark ? CC.bg0 : CC.lBg2,
            borderBottom: `1px solid ${isDark ? CC.border : CC.lBorder}`,
            "&:hover .add-comment-btn": { opacity: 1 },
          }}
        >
          {onEditComment &&
            whiteMove?.node.isMainline &&
            (editingMoveIdx === whiteMove.node.ply ? (
              <MoveComment
                comment={whiteMove.comment}
                isEditing
                moveColor="w"
                moveIdx={whiteMove.node.ply}
                onEditEnd={() => setEditingMoveIdx(null)}
                onSave={(idx, text) => {
                  onEditComment(idx, text);
                  setEditingMoveIdx(null);
                }}
              />
            ) : (
              <MoveComment
                comment={whiteMove?.comment}
                moveColor="w"
                moveIdx={whiteMove.node.ply}
                onEditEnd={() => setEditingMoveIdx(null)}
                onEditStart={() => setEditingMoveIdx(whiteMove.node.ply)}
                onSave={onEditComment}
              />
            ))}

          {whiteVariationIds.map((variationId) => (
            <MovesBranch
              key={variationId}
              commentMap={commentMap}
              gameEvalPositions={gameEvalPositions}
              indent={indent + 1}
              onEditComment={onEditComment}
              startNodeId={variationId}
              tree={tree}
            />
          ))}

          {onEditComment &&
            blackMove?.node.isMainline &&
            (editingMoveIdx === blackMove.node.ply ? (
              <MoveComment
                comment={blackMove.comment}
                isEditing
                moveColor="b"
                moveIdx={blackMove.node.ply}
                onEditEnd={() => setEditingMoveIdx(null)}
                onSave={(idx, text) => {
                  onEditComment(idx, text);
                  setEditingMoveIdx(null);
                }}
              />
            ) : (
              <MoveComment
                comment={blackMove?.comment}
                moveColor="b"
                moveIdx={blackMove.node.ply}
                onEditEnd={() => setEditingMoveIdx(null)}
                onEditStart={() => setEditingMoveIdx(blackMove.node.ply)}
                onSave={onEditComment}
              />
            ))}

          {blackVariationIds.map((variationId) => (
            <MovesBranch
              key={variationId}
              commentMap={commentMap}
              gameEvalPositions={gameEvalPositions}
              indent={indent + 1}
              onEditComment={onEditComment}
              startNodeId={variationId}
              tree={tree}
            />
          ))}
        </Grid>
      )}
    </Grid>
  );
}

const buildDisplayMove = (
  node: AnalysisNode,
  commentMap: Map<string, string>,
  gameEvalPositions?: {
    moveClassification?: MoveClassification;
  }[]
): DisplayMove => ({
  node,
  moveClassification: node.isMainline
    ? gameEvalPositions?.[node.ply]?.moveClassification
    : undefined,
  comment:
    node.isMainline && commentMap.get(node.afterFen)
      ? getCommentDisplay(commentMap.get(node.afterFen) ?? "")
      : undefined,
});
