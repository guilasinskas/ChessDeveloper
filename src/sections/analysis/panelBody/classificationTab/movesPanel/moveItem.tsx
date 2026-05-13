import { MoveClassification } from "@/types/enums";
import { Grid2 as Grid } from "@mui/material";
import Image from "next/image";
import { useAtomValue, useSetAtom } from "jotai";
import { selectAtom } from "jotai/utils";
import { currentAnalysisNodeIdAtom } from "../../../states";
import { goToNodeAction } from "../../../actions";
import { memo, useEffect, useMemo } from "react";
import { isInViewport } from "@/lib/helpers";
import { CC, CLASSIFICATION_COLORS } from "@/constants";
import PrettyMoveSan from "@/components/prettyMoveSan";

interface Props {
  san: string;
  moveClassification?: MoveClassification;
  nodeId: string;
  ply: number;
  moveColor: "w" | "b";
}

const baseSx = {
  flexGrow: 1,
  flexBasis: 0,
  minWidth: 0,
  pl: "6px",
  pr: "6px",
  py: "4px",
  cursor: "pointer",
  borderRadius: "2px",
  borderLeft: "2px solid transparent",
  transition: "background-color 80ms ease, border-color 80ms ease",
  backgroundColor: "transparent",
} as const;

// Current-move highlight uses the peach affective tint from the Zenith
// design system — the same color used in the Stitch reference for the
// active move row.
const currentSxLight = {
  ...baseSx,
  pl: "6px",
  cursor: "default",
  borderLeft: "2px solid transparent",
  borderRadius: "var(--cc-radius-sm)",
  backgroundColor: "var(--cc-secondary-container)",
  color: "var(--cc-on-secondary-container)",
} as const;

const currentSxDark = {
  ...baseSx,
  pl: "6px",
  cursor: "default",
  borderLeft: "2px solid transparent",
  borderRadius: "var(--cc-radius-sm)",
  backgroundColor: "var(--cc-primary-fixed)",
  color: "var(--cc-on-primary-fixed)",
} as const;

const hoverSxLight = {
  ...baseSx,
  "&:hover": { backgroundColor: CC.lBg3 },
} as const;

const hoverSxDark = {
  ...baseSx,
  "&:hover": { backgroundColor: CC.bg3 },
} as const;

function MoveItem({ san, moveClassification, nodeId, moveColor }: Props) {
  const goToNode = useSetAtom(goToNodeAction);

  const isCurrentMoveAtom = useMemo(
    () => selectAtom(currentAnalysisNodeIdAtom, (id) => id === nodeId),
    [nodeId]
  );
  const isCurrentMove = useAtomValue(isCurrentMoveAtom);
  const color = getMoveColor(moveClassification);

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
      sx={(theme) => {
        const isDark = theme.palette.mode === "dark";
        if (isCurrentMove) return isDark ? currentSxDark : currentSxLight;
        return isDark ? hoverSxDark : hoverSxLight;
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

export default memo(MoveItem);

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
