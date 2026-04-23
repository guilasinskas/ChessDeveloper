import {
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  useTheme,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { CC } from "@/constants";
import { REPERTOIRE_ROOT_ID } from "@/lib/repertoireTree";
import { useTrainingActions } from "./useTrainingActions";
import {
  currentNodeIdAtom,
  repertoireBoardOrientationAtom,
  repertoireTreeAtom,
  studyColorAtom,
} from "./states";
import {
  goNextRepertoireAction,
  goPrevRepertoireAction,
  goStartRepertoireAction,
  setRepertoireCommentAction,
  toggleRepertoireImportantAction,
} from "./actions";
import { Color } from "@/types/enums";
import { Repertoire } from "@/types/openings";

interface Props {
  repertoire: Repertoire;
  onSave: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export default function RepertoirePanel({
  repertoire,
  onSave,
  isSaving,
  hasUnsavedChanges,
}: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const tree = useAtomValue(repertoireTreeAtom);
  const currentNodeId = useAtomValue(currentNodeIdAtom);
  const [orientation, setOrientation] = useAtom(repertoireBoardOrientationAtom);
  const studyColor = useAtomValue(studyColorAtom);
  const setStudyColor = useSetAtom(studyColorAtom);

  const setComment = useSetAtom(setRepertoireCommentAction);
  const toggleImportant = useSetAtom(toggleRepertoireImportantAction);
  const goPrev = useSetAtom(goPrevRepertoireAction);
  const goNext = useSetAtom(goNextRepertoireAction);
  const goStart = useSetAtom(goStartRepertoireAction);

  const [commentDraft, setCommentDraft] = useState("");
  const { trainingActive, stats, startTraining, stopTraining } =
    useTrainingActions();

  const currentNode = tree.nodes[currentNodeId];

  useEffect(() => {
    setCommentDraft(currentNode?.comment ?? "");
  }, [currentNodeId, currentNode]);

  const handleSaveComment = () => {
    if (!currentNode || currentNodeId === REPERTOIRE_ROOT_ID) return;
    setComment({ nodeId: currentNodeId, comment: commentDraft });
  };

  const handleToggleImportant = () => {
    if (!currentNode || currentNodeId === REPERTOIRE_ROOT_ID) return;
    toggleImportant(currentNodeId);
  };

  const accuracy =
    stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        width: "100%",
      }}
    >
      <Box
        sx={{
          backgroundColor: isDark ? CC.bg2 : CC.lBg1,
          border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
          borderRadius: "8px",
          p: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Icon
            icon="streamline:book-reading"
            width={16}
            color={CC.primary}
          />
          <Typography sx={{ fontSize: 14, fontWeight: 700, flex: 1 }}>
            {repertoire.name}
          </Typography>
          <Chip
            label={repertoire.color === Color.White ? "White" : "Black"}
            size="small"
            sx={{
              backgroundColor:
                repertoire.color === Color.White ? "#f0eee5" : "#2a2a2a",
              color: repertoire.color === Color.White ? "#1a1a1a" : "#fafaf8",
              fontWeight: 700,
            }}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Tooltip title="Start">
            <IconButton size="small" onClick={() => goStart()}>
              <Icon icon="material-symbols:first-page" width={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Previous">
            <IconButton size="small" onClick={() => goPrev()}>
              <Icon icon="material-symbols:chevron-left" width={20} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Next">
            <IconButton size="small" onClick={() => goNext()}>
              <Icon icon="material-symbols:chevron-right" width={20} />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Flip board">
            <IconButton
              size="small"
              onClick={() =>
                setOrientation(
                  orientation === Color.White ? Color.Black : Color.White
                )
              }
            >
              <Icon icon="material-symbols:swap-vert" width={18} />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={
              hasUnsavedChanges ? "Unsaved changes" : "All changes saved"
            }
          >
            <Box>
              <Button
                size="small"
                variant="contained"
                onClick={onSave}
                disabled={!hasUnsavedChanges || isSaving}
                startIcon={
                  <Icon
                    icon={
                      isSaving
                        ? "eos-icons:loading"
                        : "material-symbols:save-outline"
                    }
                    width={14}
                  />
                }
              >
                {isSaving ? "Saving" : "Save"}
              </Button>
            </Box>
          </Tooltip>
        </Box>

        <ToggleButtonGroup
          fullWidth
          size="small"
          exclusive
          value={trainingActive ? "train" : "edit"}
          onChange={(_, v) => {
            if (v === "train") startTraining();
            else if (v === "edit") stopTraining();
          }}
          sx={{
            mb: 1,
            "& .MuiToggleButton-root": {
              fontSize: 12,
              fontWeight: 600,
              border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
            },
          }}
        >
          <ToggleButton value="edit">
            <Icon icon="material-symbols:edit-outline" width={14} style={{ marginRight: 4 }} />
            Edit
          </ToggleButton>
          <ToggleButton value="train">
            <Icon icon="streamline:graduation-cap" width={14} style={{ marginRight: 4 }} />
            Train
          </ToggleButton>
        </ToggleButtonGroup>

        {trainingActive && (
          <Box
            sx={{
              backgroundColor: isDark ? CC.bg3 : CC.lBg3,
              borderRadius: "6px",
              p: 1.5,
              mb: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                Training as {repertoire.color === Color.White ? "White" : "Black"}
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Chip
                label={`${stats.correct}/${stats.total}`}
                size="small"
                sx={{
                  fontWeight: 700,
                  backgroundColor: CC.primaryMuted,
                  color: CC.primary,
                }}
              />
              <Chip
                label={`${accuracy}%`}
                size="small"
                sx={{
                  fontWeight: 700,
                  backgroundColor:
                    accuracy >= 80
                      ? CC.greenMuted
                      : accuracy >= 50
                        ? "rgba(240,191,95,0.15)"
                        : "rgba(196,92,92,0.15)",
                  color:
                    accuracy >= 80
                      ? CC.green
                      : accuracy >= 50
                        ? CC.gold
                        : "#c45c5c",
                }}
              />
            </Box>
            {stats.current?.played && (
              <Typography sx={{ fontSize: 12, color: "#c45c5c", mt: 0.5 }}>
                ❌ {stats.current.played} — expected:{" "}
                {stats.current.expected.join(" / ") || "(no moves yet)"}
              </Typography>
            )}
          </Box>
        )}

        {!trainingActive && (
          <Box>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                color: isDark ? CC.textMuted : "#a0a09e",
                mb: 0.75,
              }}
            >
              Study side
            </Typography>
            <ToggleButtonGroup
              fullWidth
              size="small"
              exclusive
              value={studyColor}
              onChange={(_, v) => v && setStudyColor(v as Color)}
              sx={{
                "& .MuiToggleButton-root": {
                  fontSize: 12,
                  fontWeight: 600,
                  border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
                },
              }}
            >
              <ToggleButton value={Color.White}>White</ToggleButton>
              <ToggleButton value={Color.Black}>Black</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}
      </Box>

      {currentNodeId !== REPERTOIRE_ROOT_ID && currentNode && !trainingActive && (
        <Box
          sx={{
            backgroundColor: isDark ? CC.bg2 : CC.lBg1,
            border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
            borderRadius: "8px",
            p: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography
              sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? CC.textMuted : "#a0a09e", flex: 1 }}
            >
              Current move: {currentNode.san}
            </Typography>
            <Tooltip
              title={
                currentNode.important
                  ? "Unmark important"
                  : "Mark as important"
              }
            >
              <IconButton
                size="small"
                onClick={handleToggleImportant}
                sx={{ color: currentNode.important ? CC.gold : undefined }}
              >
                <Icon
                  icon={
                    currentNode.important
                      ? "material-symbols:star"
                      : "material-symbols:star-outline"
                  }
                  width={16}
                />
              </IconButton>
            </Tooltip>
          </Box>

          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            size="small"
            placeholder="Add a comment for this move…"
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            onBlur={handleSaveComment}
            sx={{ mb: 1 }}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              size="small"
              variant="text"
              onClick={handleSaveComment}
              disabled={(currentNode.comment ?? "") === commentDraft.trim()}
            >
              Save comment
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
