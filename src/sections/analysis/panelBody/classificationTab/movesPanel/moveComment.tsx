import { Box, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useState, useRef, useEffect } from "react";

interface Props {
  comment?: string;
  moveColor: "w" | "b";
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  onDelete?: () => void;
  onSave: (text: string) => void;
}

export default function MoveComment({
  comment,
  moveColor,
  isEditing: externalEditing,
  onEditStart,
  onEditEnd,
  onDelete,
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
    onSave(draft);
    onEditEnd?.();
  };

  const handleCancel = () => {
    onEditEnd?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
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
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            mt: 0.5,
            justifyContent: "space-between",
          }}
        >
          {onDelete && comment ? (
            <Tooltip title="Delete comment">
              <IconButton size="small" onClick={onDelete} color="error">
                <Icon icon="material-symbols:delete-outline" width={16} />
              </IconButton>
            </Tooltip>
          ) : (
            <Box />
          )}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton size="small" onClick={handleCancel} color="default">
              <Icon icon="material-symbols:close" width={16} />
            </IconButton>
            <IconButton size="small" onClick={handleSave} color="primary">
              <Icon icon="material-symbols:check" width={16} />
            </IconButton>
          </Box>
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
        "&:hover .comment-actions": { opacity: 1 },
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
      <Box
        className="comment-actions"
        sx={{
          display: "flex",
          gap: 0.25,
          opacity: 0,
          transition: "opacity 0.15s",
          flexShrink: 0,
          marginTop: 0.25,
        }}
      >
        <Icon
          icon="material-symbols:edit-outline"
          width={13}
        />
        {onDelete && (
          <Box
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            sx={{
              cursor: "pointer",
              color: "inherit",
              "&:hover": { color: "#e57373" },
            }}
          >
            <Icon icon="material-symbols:delete-outline" width={13} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
