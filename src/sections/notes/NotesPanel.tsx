import { Box, Button, IconButton, Tooltip, Typography, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";
import { CC } from "@/constants";
import { useNotesDatabase, noteImageUrl } from "@/hooks/useNotesDatabase";
import { Note } from "@/types/notes";
import NoteEditorDialog from "./NoteEditorDialog";

interface Props {
  fen?: string;
  gameId?: number;
  repertoireId?: number;
  repertoireNodeId?: string;
  scope?: "position" | "game" | "repertoire";
  title?: string;
}

const positionMatches = (noteFen: string | undefined, fen: string): boolean => {
  if (!noteFen) return false;
  const a = noteFen.split(" ").slice(0, 4).join(" ");
  const b = fen.split(" ").slice(0, 4).join(" ");
  return a === b;
};

export default function NotesPanel({
  fen,
  gameId,
  repertoireId,
  repertoireNodeId,
  scope = "position",
  title,
}: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { notes } = useNotesDatabase(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const visible = useMemo<Note[]>(() => {
    return notes
      .filter((n) => {
        if (scope === "position") {
          if (!fen) return false;
          return positionMatches(n.fen, fen);
        }
        if (scope === "game") {
          if (!gameId) return false;
          return n.gameId === gameId;
        }
        if (scope === "repertoire") {
          if (!repertoireId) return false;
          if (n.repertoireId !== repertoireId) return false;
          if (repertoireNodeId)
            return n.repertoireNodeId === repertoireNodeId || !n.repertoireNodeId;
          return true;
        }
        return false;
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [notes, fen, gameId, repertoireId, repertoireNodeId, scope]);

  const headerTitle =
    title ??
    (scope === "position"
      ? "Notes for this position"
      : scope === "game"
        ? "Notes for this game"
        : "Repertoire notes");

  return (
    <>
      <Box
        sx={{
          width: "100%",
          backgroundColor: isDark ? CC.bg2 : CC.lBg1,
          border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderBottom: `1px solid ${isDark ? CC.border : CC.lBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isDark ? CC.bg0 : CC.lBg2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Icon
              icon="material-symbols:sticky-note-2-outline"
              width={15}
              color={isDark ? CC.textSub : CC.lTextSub}
            />
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: isDark ? CC.textMuted : "#a0a09e",
              }}
            >
              {headerTitle}
            </Typography>
          </Box>
          <Tooltip title="New note">
            <IconButton
              size="small"
              onClick={() => setCreating(true)}
              sx={{ color: CC.primary }}
            >
              <Icon icon="material-symbols:add" width={16} />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 0.75 }}>
          {visible.length === 0 ? (
            <Box
              sx={{
                py: 2.5,
                px: 2,
                textAlign: "center",
                color: isDark ? CC.textMuted : "#a0a09e",
              }}
            >
              <Typography sx={{ fontSize: 12, mb: 1 }}>
                No notes here yet.
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setCreating(true)}
                startIcon={<Icon icon="material-symbols:add" width={13} />}
                sx={{ fontSize: 12 }}
              >
                Add your first note
              </Button>
            </Box>
          ) : (
            visible.map((n) => (
              <Box
                key={n.id}
                onClick={() => setEditingId(n.id)}
                sx={{
                  px: 1.25,
                  py: 1,
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: `1px solid transparent`,
                  "&:hover": {
                    borderColor: isDark ? CC.border : CC.lBorder,
                    backgroundColor: isDark ? CC.bg3 : CC.lBg3,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isDark ? CC.text : CC.lText,
                    mb: n.content || n.imageIds.length ? 0.25 : 0,
                  }}
                >
                  {n.title}
                </Typography>
                {n.content && (
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: isDark ? CC.textSub : CC.lTextSub,
                      whiteSpace: "pre-wrap",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {n.content}
                  </Typography>
                )}
                {n.imageIds.length > 0 && (
                  <Box sx={{ display: "flex", gap: 0.5, mt: 0.75 }}>
                    {n.imageIds.slice(0, 4).map((id) => (
                      <Box
                        key={id}
                        component="img"
                        src={noteImageUrl(id)}
                        alt=""
                        sx={{
                          width: 36,
                          height: 36,
                          objectFit: "cover",
                          borderRadius: "4px",
                          border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
                        }}
                      />
                    ))}
                    {n.imageIds.length > 4 && (
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "4px",
                          backgroundColor: isDark ? CC.bg3 : CC.lBg3,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
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
              </Box>
            ))
          )}
        </Box>
      </Box>

      {creating && (
        <NoteEditorDialog
          open={creating}
          onClose={() => setCreating(false)}
          initialFen={scope === "position" ? fen : undefined}
          initialGameId={scope === "game" ? gameId : undefined}
          initialRepertoireId={
            scope === "repertoire" ? repertoireId : undefined
          }
          initialRepertoireNodeId={
            scope === "repertoire" ? repertoireNodeId : undefined
          }
        />
      )}

      {editingId !== null && (
        <NoteEditorDialog
          open={editingId !== null}
          onClose={() => setEditingId(null)}
          noteId={editingId}
        />
      )}
    </>
  );
}
