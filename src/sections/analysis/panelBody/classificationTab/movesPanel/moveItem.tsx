import { MoveClassification } from "@/types/enums";
import { Grid2 as Grid } from "@mui/material";
import Image from "next/image";
import { useAtomValue } from "jotai";
import { currentAnalysisNodeIdAtom } from "../../../states";
import { useEffect } from "react";
import { isInViewport } from "@/lib/helpers";
import { CC, CLASSIFICATION_COLORS } from "@/constants";
import PrettyMoveSan from "@/components/prettyMoveSan";
import { useAnalysisActions } from "@/hooks/useAnalysisActions";

interface Props {
  san: string;
  moveClassification?: MoveClassification;
  nodeId: string;
  ply: number;
  moveColor: "w" | "b";
}

export default function MoveItem({
  san,
  moveClassification,
  nodeId,
  moveColor,
}: Props) {
  const { goToNode } = useAnalysisActions();
  const currentNodeId = useAtomValue(currentAnalysisNodeIdAtom);
  const color = getMoveColor(moveClassification);

  const isCurrentMove = currentNodeId === nodeId;

  useEffect(() => {
    if (!isCurrentMove) return;
    const moveItem = document.getElementById(`move-${nodeId}`);
    if (!moveItem) return;

    const movePanel = document.getElementById("moves-panel");
    if (!movePanel || !isInViewport(movePanel)) return;

    moveItem.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isCurrentMove, nodeId]);

  const handleClick = () => {
    if (isCurrentMove) return;
    goToNode(nodeId);
  };

  return (
    <Grid
      container
      justifyContent="start"
      alignItems="center"
      gap={0.5}
      // Chess.com move cells fill the column width, flat rectangles
      sx={(theme) => {
        const isDark = theme.palette.mode === "dark";
        return {
          flexGrow: 1,
          flexBasis: 0,
          minWidth: 0,
          pl: isCurrentMove ? "4px" : "6px",
          pr: "6px",
          py: "4px",
          cursor: isCurrentMove ? "default" : "pointer",
          borderRadius: "2px",
          borderLeft: isCurrentMove
            ? `2px solid ${CC.primary}`
            : "2px solid transparent",
          transition: "background-color 80ms ease, border-color 80ms ease",
          backgroundColor: isCurrentMove
            ? isDark
              ? CC.primaryMuted
              : "rgba(172,199,255,0.15)"
            : "transparent",
          "&:hover": !isCurrentMove
            ? { backgroundColor: isDark ? CC.bg3 : CC.lBg3 }
            : undefined,
        };
      }}
      id={`move-${nodeId}`}
      onClick={handleClick}
      wrap="nowrap"
    >
      {color && (
        <Image
          src={`/icons/${moveClassification}.png`}
          alt="move-icon"
          width={12}
          height={12}
          style={{ flexShrink: 0 }}
        />
      )}

      <PrettyMoveSan
        san={san}
        color={moveColor}
        typographyProps={{
          fontSize: "0.8rem",
          fontWeight: isCurrentMove ? 700 : 400,
          noWrap: true,
        }}
      />
    </Grid>
  );
}

const getMoveColor = (moveClassification?: MoveClassification) => {
  if (
    !moveClassification ||
    moveClassificationsToIgnore.includes(moveClassification)
  ) {
    return undefined;
  }

  return CLASSIFICATION_COLORS[moveClassification];
};

const moveClassificationsToIgnore: MoveClassification[] = [
  MoveClassification.Okay,
  MoveClassification.Excellent,
  MoveClassification.Forced,
];
