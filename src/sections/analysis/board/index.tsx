import { useAtomValue } from "jotai";
import {
  analysisTreeAtom,
  boardAtom,
  boardOrientationAtom,
  currentAnalysisNodeIdAtom,
  currentPositionAtom,
  gameAtom,
  showBestMoveArrowAtom,
  showEngineAtom,
  showPlayerMoveIconAtom,
} from "../states";
import { useMemo } from "react";
import { LAYOUT, useScreenSize } from "@/hooks/useScreenSize";
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
  const showEngine = useAtomValue(showEngineAtom);
  const { white, black } = usePlayersData(gameAtom);
  const { playMove } = useAnalysisActions();
  const currentNodeId = useAtomValue(currentAnalysisNodeIdAtom);
  const analysisTree = useAtomValue(analysisTreeAtom);

  const annotationArrows = useMemo(() => {
    const comment = analysisTree.nodes[currentNodeId]?.comment;
    if (!comment) return [];
    return getCommentArrows(comment) as unknown as Arrow[];
  }, [analysisTree, currentNodeId]);

  // Board sizing — explicit viewport math.
  //
  // `boardSize` here is the size of the actual CHESSBOARD SQUARES area,
  // NOT the outer column. The column also stacks (top to bottom):
  //   playerHeader · rowGap · chessboard · rowGap · playerHeader
  // So we subtract two playerHeaderHeights + two rowGaps from the vertical
  // budget so the whole column fits inside the viewport without overflow.
  //
  // Width-wise we subtract the eval bar slot in addition to the sidebar,
  // page padding, board-panel gap and the panel's min width. The result is
  // the largest square that fits in either axis — the chessboard.
  //
  // Below lg the board stacks above the panel and the math is simpler.
  const boardSize = useMemo(() => {
    const { width, height } = screenSize;

    if (width < LAYOUT.bpSideBySide) {
      const verticalBudget =
        height -
        (width < LAYOUT.bpSidebar ? LAYOUT.navbarHeight : 0) -
        LAYOUT.titleBarHeight -
        2 * LAYOUT.pagePaddingY -
        2 * LAYOUT.playerHeaderHeight -
        2 * LAYOUT.boardRowGap;
      const horizontalBudget =
        width -
        (width < LAYOUT.bpSidebar ? 0 : LAYOUT.sidebarWidth) -
        2 * LAYOUT.pagePaddingX -
        LAYOUT.evalBarWidth;
      return Math.min(horizontalBudget, verticalBudget);
    }

    const verticalBudget =
      height -
      LAYOUT.titleBarHeight -
      2 * LAYOUT.pagePaddingY -
      2 * LAYOUT.playerHeaderHeight -
      2 * LAYOUT.boardRowGap;
    const horizontalBudget =
      width -
      LAYOUT.sidebarWidth -
      2 * LAYOUT.pagePaddingX -
      LAYOUT.boardPanelGap -
      LAYOUT.panelMinWidth -
      LAYOUT.evalBarWidth;
    return Math.min(verticalBudget, horizontalBudget);
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
      showBestMoveArrow={showBestMoveArrow && showEngine}
      showPlayerMoveIconAtom={showPlayerMoveIconAtom}
      showEngineAtom={showEngineAtom}
      showEvaluationBar={showEngine}
      annotationArrows={annotationArrows}
      onPlayMove={playMove}
    />
  );
}
