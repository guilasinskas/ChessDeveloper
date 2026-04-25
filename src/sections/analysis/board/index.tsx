import { useAtomValue } from "jotai";
import {
  analysisTreeAtom,
  boardAtom,
  boardOrientationAtom,
  currentAnalysisNodeIdAtom,
  currentPositionAtom,
  gameAtom,
  showBestMoveArrowAtom,
  showPlayerMoveIconAtom,
} from "../states";
import { useMemo } from "react";
import { useScreenSize } from "@/hooks/useScreenSize";
import { Color } from "@/types/enums";
import Board from "@/components/board";
import { usePlayersData } from "@/hooks/usePlayersData";
import { useAnalysisActions } from "@/hooks/useAnalysisActions";
import { getCommentArrows } from "@/lib/chess";
import { Arrow } from "react-chessboard/dist/chessboard/types";

export default function BoardContainer() {
  const screenSize = useScreenSize();
  const boardOrientation = useAtomValue(boardOrientationAtom);
  const showBestMoveArrow = useAtomValue(showBestMoveArrowAtom);
  const { white, black } = usePlayersData(gameAtom);
  const { playMove } = useAnalysisActions();
  const currentNodeId = useAtomValue(currentAnalysisNodeIdAtom);
  const analysisTree = useAtomValue(analysisTreeAtom);

  const annotationArrows = useMemo(() => {
    const comment = analysisTree.nodes[currentNodeId]?.comment;
    if (!comment) return [];
    return getCommentArrows(comment) as unknown as Arrow[];
  }, [analysisTree, currentNodeId]);

  const boardSize = useMemo(() => {
    const width = screenSize.width;
    const height = screenSize.height;

    if (window?.innerWidth < 1200) {
      return Math.min(width, height - 80);
    }

    return Math.min(width - 480, height * 0.98);
  }, [screenSize]);

  return (
    <Board
      id="AnalysisBoard"
      boardSize={boardSize}
      canPlay={true}
      gameAtom={boardAtom}
      whitePlayer={white}
      blackPlayer={black}
      boardOrientation={boardOrientation ? Color.White : Color.Black}
      currentPositionAtom={currentPositionAtom}
      showBestMoveArrow={showBestMoveArrow}
      showPlayerMoveIconAtom={showPlayerMoveIconAtom}
      showEvaluationBar={true}
      annotationArrows={annotationArrows}
      onPlayMove={playMove}
    />
  );
}
