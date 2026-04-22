import { Grid2 as Grid } from "@mui/material";
import MovesBranch from "./movesLine";
import { useCallback, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { analysisTreeAtom, gameAtom, gameEvalAtom } from "../../../states";
import { setCommentAtMoveIdx } from "@/lib/chess";

export default function MovesPanel() {
  const game = useAtomValue(gameAtom);
  const setGame = useSetAtom(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const analysisTree = useAtomValue(analysisTreeAtom);

  const commentMap = useMemo(
    () =>
      new Map(
        game.getComments().map((comment) => [comment.fen, comment.comment])
      ),
    [game]
  );

  const handleEditComment = useCallback(
    (moveIdx: number, text: string) => {
      setGame((prev) => setCommentAtMoveIdx(prev, moveIdx, text));
    },
    [setGame]
  );

  const mainlineStartId = analysisTree.nodes[analysisTree.rootId]?.children[0];
  const rootVariationIds =
    analysisTree.nodes[analysisTree.rootId]?.children.slice(1) ?? [];

  if (!mainlineStartId && rootVariationIds.length === 0) return null;

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="start"
      gap={0.5}
      paddingY={1}
      sx={{ scrollbarWidth: "thin", overflowY: "auto" }}
      maxHeight="100%"
      size={6}
      id="moves-panel"
    >
      {mainlineStartId && (
        <MovesBranch
          commentMap={commentMap}
          gameEvalPositions={gameEval?.positions}
          onEditComment={handleEditComment}
          startNodeId={mainlineStartId}
          tree={analysisTree}
        />
      )}

      {rootVariationIds.map((variationId) => (
        <MovesBranch
          key={variationId}
          commentMap={commentMap}
          gameEvalPositions={gameEval?.positions}
          indent={1}
          onEditComment={handleEditComment}
          startNodeId={variationId}
          tree={analysisTree}
        />
      ))}
    </Grid>
  );
}
