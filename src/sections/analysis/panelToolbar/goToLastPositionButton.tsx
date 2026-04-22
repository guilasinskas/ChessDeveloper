import { useAtomValue } from "jotai";
import { analysisTreeAtom, currentAnalysisNodeIdAtom } from "../states";
import { useEffect } from "react";
import { ToolbarButton } from "@/components/ToolbarButton";
import { useAnalysisActions } from "@/hooks/useAnalysisActions";

export default function GoToLastPositionButton() {
  const { goToLastPosition } = useAnalysisActions();
  const analysisTree = useAtomValue(analysisTreeAtom);
  const currentNodeId = useAtomValue(currentAnalysisNodeIdAtom);

  const isButtonDisabled = !analysisTree.nodes[currentNodeId]?.children?.[0];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        if (isButtonDisabled) return;
        goToLastPosition();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [goToLastPosition, isButtonDisabled]);

  return (
    <ToolbarButton
      tooltip="Go to final position"
      onClick={() => {
        if (isButtonDisabled) return;
        goToLastPosition();
      }}
      icon="ri:skip-forward-line"
      disabled={isButtonDisabled}
    />
  );
}
