import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useState } from "react";
import { CC } from "@/constants";
import { useNotesDatabase } from "@/hooks/useNotesDatabase";
import { Note } from "@/types/notes";
import NoteImageUploader from "./NoteImageUploader";

interface Props {
  open: boolean;
  onClose: () => void;
  noteId?: number;
  initialFen?: string;
  initialGameId?: number;
  initialRepertoireId?: number;
  initialRepertoireNodeId?: string;
  onSaved?: (note: Note) => void;
}

export default function NoteEditorDialog({
  open,
  onClose,
  noteId,
  initialFen,
  initialGameId,
  initialRepertoireId,
  initialRepertoireNodeId,
  onSaved,
}: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { notes, addNote, updateNote, deleteNote } = useNotesDatabase();

  const existing = useMemo(
    () => (noteId ? notes.find((n) => n.id === noteId) : undefined),
    [noteId, notes]
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [imageIds, setImageIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setTitle(existing.title);
      setContent(existing.content);
      setTags(existing.tags || []);
      setImageIds(existing.imageIds || []);
    } else {
      setTitle("");
      setContent("");
      setTags([]);
      setImageIds([]);
    }
    setTagDraft("");
  }, [open, existing]);

  const fen =
    existing?.fen ?? initialFen ?? undefined;
  const gameId = existing?.gameId ?? initialGameId;
  const repertoireId = existing?.repertoireId ?? initialRepertoireId;
  const repertoireNodeId =
    existing?.repertoireNodeId ?? initialRepertoireNodeId;

  const handleAddTag = () => {
    const t = tagDraft.trim();
    if (!t) return;
    if (tags.includes(t)) {
      setTagDraft("");
      return;
    }
    setTags([...tags, t]);
    setTagDraft("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        title: title.trim() || (fen ? "Position note" : "Untitled note"),
        content,
        fen,
        gameId,
        repertoireId,
        repertoireNodeId,
        tags,
        imageIds,
      };
      const result = noteId
        ? await updateNote(noteId, payload)
        : await addNote(payload);
      onSaved?.(result);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!noteId) return;
    if (!confirm("Delete this note?")) return;
    setIsSaving(true);
    try {
      await deleteNote(noteId);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Icon
            icon={
              noteId
                ? "material-symbols:edit-note-outline"
                : "material-symbols:note-add-outline"
            }
            width={18}
          />
          {noteId ? "Edit note" : "New note"}
          <Box sx={{ flex: 1 }} />
          {fen && (
            <Tooltip title={`Linked to FEN: ${fen}`}>
              <Chip
                label="position"
                size="small"
                icon={<Icon icon="streamline:chess-pawn" width={11} />}
                sx={{ fontSize: 10 }}
              />
            </Tooltip>
          )}
          {repertoireId && (
            <Chip
              label="repertoire"
              size="small"
              icon={<Icon icon="streamline:book-reading" width={11} />}
              sx={{ fontSize: 10 }}
            />
          )}
          {gameId && (
            <Chip
              label="game"
              size="small"
              icon={<Icon icon="streamline:database" width={11} />}
              sx={{ fontSize: 10 }}
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          InputProps={{
            sx: { fontSize: 16, fontWeight: 600 },
          }}
          sx={{ mb: 1.5, mt: 0.5 }}
        />

        <TextField
          fullWidth
          multiline
          minRows={6}
          maxRows={20}
          placeholder="Write your note. Markdown is allowed for your own reference (formatting is shown as plain text)."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 2 }}>
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
            Tags
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {tags.map((t) => (
              <Chip
                key={t}
                label={t}
                size="small"
                onDelete={() => setTags(tags.filter((x) => x !== t))}
                sx={{ fontWeight: 600 }}
              />
            ))}
            <TextField
              size="small"
              placeholder="Add tag…"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              onBlur={handleAddTag}
              sx={{ width: 140 }}
              InputProps={{
                sx: { fontSize: 12, py: 0.25 },
              }}
            />
          </Stack>
        </Box>

        <NoteImageUploader imageIds={imageIds} onChange={setImageIds} />
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        {noteId && (
          <IconButton
            size="small"
            onClick={handleDelete}
            disabled={isSaving}
            sx={{ color: "#c45c5c" }}
          >
            <Icon icon="mdi:delete-outline" width={18} />
          </IconButton>
        )}
        <Box sx={{ flex: 1 }} />
        <Button variant="text" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving}
          startIcon={
            <Icon
              icon={isSaving ? "eos-icons:loading" : "material-symbols:save-outline"}
              width={14}
            />
          }
        >
          {isSaving ? "Saving" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
