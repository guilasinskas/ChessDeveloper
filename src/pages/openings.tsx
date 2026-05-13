import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";
import { CC } from "@/constants";
import { PageTitle } from "@/components/pageTitle";
import { useRepertoireDatabase } from "@/hooks/useRepertoireDatabase";
import { useRouter } from "next/router";
import { Color } from "@/types/enums";
import { createEmptyRepertoireTree } from "@/lib/repertoireTree";

export default function OpeningsListPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const router = useRouter();
  const { repertoires, addRepertoire, deleteRepertoire } =
    useRepertoireDatabase(true);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<Color>(Color.White);
  const [isSaving, setIsSaving] = useState(false);

  const sorted = useMemo(
    () =>
      [...repertoires].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [repertoires]
  );

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const created = await addRepertoire({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        tree: createEmptyRepertoireTree(),
      });
      setCreating(false);
      setName("");
      setDescription("");
      router.push(`/openings/${created.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <PageTitle title="Chesskit Opening Studies" />

      {/* Sticky title bar — Stitch "Repertoire Editor" pattern */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
          px: { xs: 2, md: 3 },
          backgroundColor:
            "color-mix(in srgb, var(--cc-surface) 80%, transparent)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${CC.border}`,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Typography
          sx={{
            fontFamily: "var(--cc-font-headline)",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: CC.primary,
          }}
        >
          Repertoire Editor
        </Typography>
        <Button
          variant="contained"
          startIcon={<Icon icon="material-symbols:add" width={16} />}
          onClick={() => setCreating(true)}
        >
          New repertoire
        </Button>
      </Box>

      <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pt: 3, pb: 4 }}>
        <Typography
          sx={{
            fontFamily: "var(--cc-font-body)",
            color: CC.textSub,
            fontSize: 14,
            mb: 3,
          }}
        >
          {repertoires.length} repertoire{repertoires.length !== 1 && "s"} —
          build move trees and train them
        </Typography>

      {sorted.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 8,
            backgroundColor: "var(--cc-surface-container-lowest)",
            borderRadius: "var(--cc-radius-xl)",
            boxShadow: "var(--cc-shadow-ambient)",
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              backgroundColor: "var(--cc-primary-fixed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <Icon icon="material-symbols:menu-book-outline" width={36} color={CC.primary} />
          </Box>
          <Typography
            sx={{
              fontFamily: "var(--cc-font-headline)",
              fontSize: 22,
              fontWeight: 700,
              color: CC.text,
            }}
          >
            No repertoires yet
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              fontSize: 14,
              color: CC.textSub,
              maxWidth: 360,
              textAlign: "center",
            }}
          >
            Create your first opening study to start building a move tree.
          </Typography>
          <Button
            sx={{ mt: 3 }}
            variant="contained"
            startIcon={<Icon icon="material-symbols:add" width={16} />}
            onClick={() => setCreating(true)}
          >
            Create repertoire
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "1fr 1fr 1fr",
            },
            gap: 1.5,
          }}
        >
          {sorted.map((r) => {
            const totalNodes = Object.keys(r.tree.nodes).length - 1;
            const variations =
              Object.values(r.tree.nodes).filter(
                (n) => !n.isMainline && n.id !== r.tree.rootId
              ).length;

            return (
              <Box
                key={r.id}
                sx={{
                  backgroundColor: "var(--cc-surface-container-lowest)",
                  borderRadius: "var(--cc-radius-xl)",
                  boxShadow: "var(--cc-shadow-soft)",
                  p: 2.5,
                  cursor: "pointer",
                  transition: "all 200ms ease",
                  "&:hover": {
                    boxShadow: "var(--cc-shadow-ambient)",
                    transform: "translateY(-2px)",
                  },
                }}
                onClick={() => router.push(`/openings/${r.id}`)}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      backgroundColor:
                        r.color === Color.White ? "#f0eee5" : "#1a1a1a",
                      border: `2px solid ${
                        r.color === Color.White ? "#c0bab4" : "#404040"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon
                      icon="streamline:chess-pawn"
                      width={18}
                      color={r.color === Color.White ? "#1a1a1a" : "#fafaf8"}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 15,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: isDark ? CC.textMuted : "#8a8480",
                      }}
                    >
                      {r.color === Color.White ? "White" : "Black"} repertoire
                    </Typography>
                  </Box>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${r.name}"?`))
                          await deleteRepertoire(r.id);
                      }}
                      sx={{ color: "#c45c5c" }}
                    >
                      <Icon icon="mdi:delete-outline" width={15} />
                    </IconButton>
                  </Tooltip>
                </Box>

                {r.description && (
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: isDark ? CC.textSub : CC.lTextSub,
                      mb: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {r.description}
                  </Typography>
                )}

                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: isDark ? CC.text : CC.lText,
                        lineHeight: 1.1,
                      }}
                    >
                      {totalNodes}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: isDark ? CC.textMuted : "#8a8480",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Moves
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: isDark ? CC.text : CC.lText,
                        lineHeight: 1.1,
                      }}
                    >
                      {variations}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: isDark ? CC.textMuted : "#8a8480",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Variations
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>New repertoire</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Name"
            placeholder="e.g. Sicilian Defense — Najdorf"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
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
            Side to study
          </Typography>
          <ToggleButtonGroup
            fullWidth
            exclusive
            value={color}
            onChange={(_, v) => v && setColor(v as Color)}
            size="small"
          >
            <ToggleButton value={Color.White}>White</ToggleButton>
            <ToggleButton value={Color.Black}>Black</ToggleButton>
          </ToggleButtonGroup>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button variant="text" onClick={() => setCreating(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!name.trim() || isSaving}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  );
}
