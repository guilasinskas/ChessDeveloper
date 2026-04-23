import {
  Box,
  Button,
  Chip,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";
import { CC } from "@/constants";
import { PageTitle } from "@/components/pageTitle";
import { useNotesDatabase, noteImageUrl } from "@/hooks/useNotesDatabase";
import NoteEditorDialog from "@/sections/notes/NoteEditorDialog";

const ALL_TAG = "__all__";

export default function NotesPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { notes, deleteNote } = useNotesDatabase(true);

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>(ALL_TAG);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const n of notes) for (const t of n.tags) set.add(t);
    return Array.from(set).sort();
  }, [notes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...notes]
      .filter((n) => {
        if (tagFilter !== ALL_TAG && !n.tags.includes(tagFilter)) return false;
        if (!q) return true;
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [notes, search, tagFilter]);

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pt: 3, pb: 4 }}>
      <PageTitle title="Chesskit Notes" />

      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-end", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <Typography
            variant="h2"
            sx={{ mb: 0.5, color: isDark ? CC.text : CC.lText }}
          >
            Notes
          </Typography>
          <Typography
            sx={{
              color: isDark ? CC.textSub : CC.lTextSub,
              fontSize: 14,
            }}
          >
            {notes.length} note{notes.length !== 1 && "s"} — capture ideas,
            positions, and reference images
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="material-symbols:add" width={16} />}
          onClick={() => setCreating(true)}
        >
          New note
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <Icon
                icon="material-symbols:search"
                width={16}
                style={{ marginRight: 6, opacity: 0.6 }}
              />
            ),
          }}
          sx={{ width: { xs: "100%", sm: 280 } }}
        />
        {allTags.length > 0 && (
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", flexWrap: "wrap" }}>
            <Chip
              label="All"
              size="small"
              onClick={() => setTagFilter(ALL_TAG)}
              variant={tagFilter === ALL_TAG ? "filled" : "outlined"}
              color={tagFilter === ALL_TAG ? "primary" : "default"}
            />
            {allTags.map((t) => (
              <Chip
                key={t}
                label={t}
                size="small"
                onClick={() => setTagFilter(t === tagFilter ? ALL_TAG : t)}
                variant={tagFilter === t ? "filled" : "outlined"}
                color={tagFilter === t ? "primary" : "default"}
              />
            ))}
          </Box>
        )}
      </Box>

      {filtered.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 8,
            backgroundColor: isDark ? CC.bg2 : CC.lBg1,
            borderRadius: "16px",
            border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
          }}
        >
          <Icon
            icon="material-symbols:sticky-note-2-outline"
            width={48}
            color={isDark ? CC.textMuted : "#c0bab4"}
          />
          <Typography
            sx={{
              mt: 2,
              fontSize: 16,
              fontWeight: 600,
              color: isDark ? CC.textSub : CC.lTextSub,
            }}
          >
            {notes.length === 0 ? "No notes yet" : "No notes match your filters"}
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              fontSize: 13,
              color: isDark ? CC.textMuted : "#a0a09e",
            }}
          >
            {notes.length === 0
              ? "Create notes from any position, game, or repertoire."
              : "Try a different search term or tag."}
          </Typography>
          {notes.length === 0 && (
            <Button
              sx={{ mt: 2 }}
              variant="contained"
              startIcon={<Icon icon="material-symbols:add" width={16} />}
              onClick={() => setCreating(true)}
            >
              Create note
            </Button>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "1fr 1fr 1fr",
              lg: "1fr 1fr 1fr 1fr",
            },
            gap: 1.5,
          }}
        >
          {filtered.map((n) => (
            <Box
              key={n.id}
              onClick={() => setEditingId(n.id)}
              sx={{
                backgroundColor: isDark ? CC.bg2 : CC.lBg1,
                border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
                borderRadius: "10px",
                p: 1.75,
                cursor: "pointer",
                transition: "all 150ms ease",
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                "&:hover": {
                  borderColor: CC.primary,
                  transform: "translateY(-2px)",
                  boxShadow: isDark
                    ? "0 8px 20px rgba(0,0,0,0.4)"
                    : "0 8px 20px rgba(0,0,0,0.08)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 700,
                    flex: 1,
                    color: isDark ? CC.text : CC.lText,
                  }}
                >
                  {n.title}
                </Typography>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${n.title}"?`)) await deleteNote(n.id);
                    }}
                    sx={{ color: "#c45c5c", p: 0.25 }}
                  >
                    <Icon icon="mdi:delete-outline" width={14} />
                  </IconButton>
                </Tooltip>
              </Box>

              {n.content && (
                <Typography
                  sx={{
                    fontSize: 12,
                    color: isDark ? CC.textSub : CC.lTextSub,
                    whiteSpace: "pre-wrap",
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {n.content}
                </Typography>
              )}

              {n.imageIds.length > 0 && (
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {n.imageIds.slice(0, 4).map((id) => (
                    <Box
                      key={id}
                      component="img"
                      src={noteImageUrl(id)}
                      alt=""
                      sx={{
                        width: 56,
                        height: 56,
                        objectFit: "cover",
                        borderRadius: "4px",
                        border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
                      }}
                    />
                  ))}
                  {n.imageIds.length > 4 && (
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: "4px",
                        backgroundColor: isDark ? CC.bg3 : CC.lBg3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: isDark ? CC.textMuted : "#8a8480",
                        border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
                      }}
                    >
                      +{n.imageIds.length - 4}
                    </Box>
                  )}
                </Box>
              )}

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: "auto" }}>
                {n.tags.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    size="small"
                    sx={{
                      fontSize: 10,
                      height: 18,
                      fontWeight: 600,
                    }}
                  />
                ))}
                {n.fen && (
                  <Chip
                    icon={<Icon icon="streamline:chess-pawn" width={9} />}
                    label="position"
                    size="small"
                    sx={{ fontSize: 10, height: 18 }}
                  />
                )}
                {n.repertoireId && (
                  <Chip
                    icon={<Icon icon="streamline:book-reading" width={9} />}
                    label="repertoire"
                    size="small"
                    sx={{ fontSize: 10, height: 18 }}
                  />
                )}
                {n.gameId && (
                  <Chip
                    icon={<Icon icon="streamline:database" width={9} />}
                    label="game"
                    size="small"
                    sx={{ fontSize: 10, height: 18 }}
                  />
                )}
              </Box>

              <Typography
                sx={{
                  fontSize: 10,
                  color: isDark ? CC.textMuted : "#a0a09e",
                  mt: 0.5,
                }}
              >
                {new Date(n.updatedAt).toLocaleDateString()}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {creating && (
        <NoteEditorDialog
          open={creating}
          onClose={() => setCreating(false)}
        />
      )}
      {editingId !== null && (
        <NoteEditorDialog
          open={editingId !== null}
          onClose={() => setEditingId(null)}
          noteId={editingId}
        />
      )}
    </Box>
  );
}
