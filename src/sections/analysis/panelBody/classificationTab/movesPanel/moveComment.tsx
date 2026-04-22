import { Box, IconButton, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useState, useRef, useEffect } from "react";

interface Props {
  comment?: string;
  moveIdx: number;
  moveColor: "w" | "b";
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  onSave: (moveIdx: number, text: string) => void;
}

export default function MoveComment({
  comment,
  moveIdx,
  moveColor,
  isEditing: externalEditing,
  onEditStart,
  onEditEnd,
  onSave,
}: Props) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const editing = externalEditing ?? false;

  useEffect(() => {
    if (editing) {
      setDraft(comment ?? "");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const openEdit = () => {
    onEditStart?.();
  };

  const handleSave = () => {
    onSave(moveIdx, draft);
    onEditEnd?.();
  };

  const handleCancel = () => {
    onEditEnd?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") handleCancel();
  };

  if (editing) {
    return (
      <Box sx={{ width: "100%", px: 1, pb: 0.5 }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          size="small"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          sx={{ "& .MuiInputBase-root": { fontSize: "0.8rem" } }}
        />
        <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, justifyContent: "flex-end" }}>
          <IconButton size="small" onClick={handleCancel} color="default">
            <Icon icon="material-symbols:close" width={16} />
          </IconButton>
          <IconButton size="small" onClick={handleSave} color="primary">
            <Icon icon="material-symbols:check" width={16} />
          </IconButton>
        </Box>
      </Box>
    );
  }

  if (!comment) return null;

  return (
    <Box
      onClick={openEdit}
      sx={{
        width: "100%",
        px: 1,
        pb: 0.5,
        cursor: "pointer",
        display: "flex",
        alignItems: "flex-start",
        gap: 0.5,
        "&:hover .edit-icon": { opacity: 1 },
      }}
    >
      <Typography
        variant="caption"
        sx={(theme) => ({
          color:
            moveColor === "w"
              ? theme.palette.mode === "dark"
                ? "#c8b88a"
                : "#7d5c2a"
              : theme.palette.mode === "dark"
                ? "#a0b8d8"
                : "#2a4a7d",
          fontStyle: "italic",
          lineHeight: 1.4,
          flex: 1,
        })}
      >
        {comment}
      </Typography>
      <Icon
        icon="material-symbols:edit-outline"
        width={13}
        className="edit-icon"
        style={{
          opacity: 0,
          transition: "opacity 0.15s",
          flexShrink: 0,
          marginTop: 2,
        }}
      />
    </Box>
  );
}
