import { useAtomValue } from "jotai";
import {
  analysisTreeAtom,
  boardAtom,
  currentAnalysisNodeIdAtom,
} from "../states";
import { useEffect } from "react";
import { ToolbarButton } from "@/components/ToolbarButton";
import { useAnalysisActions } from "@/hooks/useAnalysisActions";

export default function NextMoveButton() {
  const { goToNextMove } = useAnalysisActions();
  const board = useAtomValue(boardAtom);
  const analysisTree = useAtomValue(analysisTreeAtom);
  const currentNodeId = useAtomValue(currentAnalysisNodeIdAtom);

  const boardHistory = board.history();
  const isButtonEnabled =
    boardHistory.length >= 0 &&
    !!analysisTree.nodes[currentNodeId]?.children?.[0];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        goToNextMove();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [goToNextMove]);

  return (
    <ToolbarButton
      tooltip="Go to next move"
      onClick={() => goToNextMove()}
      icon="ri:arrow-right-s-line"
      disabled={!isButtonEnabled}
      iconHeight={30}
    />
  );
}
