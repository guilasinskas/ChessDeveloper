import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Typography,
  useTheme,
  alpha,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useCallback, useMemo, useState } from "react";
import LoadGameButton from "@/sections/loadGame/loadGameButton";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useRouter } from "next/router";
import { PageTitle } from "@/components/pageTitle";
import { CC } from "@/constants";
import { Game } from "@/types/game";

const ALL_FOLDER = "__all__";
const NO_FOLDER = "__none__";

function resultColor(result?: string) {
  if (result === "1-0") return { bg: "rgba(92,140,62,0.18)", text: "#6ba048", label: "1–0" };
  if (result === "0-1") return { bg: "rgba(196,92,92,0.18)", text: "#c45c5c", label: "0–1" };
  if (result === "1/2-1/2") return { bg: "rgba(200,168,75,0.18)", text: "#c8a84b", label: "½–½" };
  return { bg: "rgba(100,100,100,0.15)", text: "#9c9794", label: result ?? "?" };
}

function PlayerAvatar({ name, isDark }: { name: string; isDark: boolean }) {
  const initials = name
    .split(/[\s._-]/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        backgroundColor: isDark ? CC.bg4 : CC.lBg3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        color: isDark ? CC.textSub : CC.lTextSub,
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {initials || "?"}
    </Box>
  );
}

interface GameRowProps {
  game: Game;
  isDark: boolean;
  onAnalyze: () => void;
  onFolder: (e: React.MouseEvent<HTMLElement>) => void;
  onDelete: () => void;
  onCopy: () => void;
  selected: boolean;
  onToggleSelect: () => void;
}

function GameRow({
  game,
  isDark,
  onAnalyze,
  onFolder,
  onDelete,
  onCopy,
  selected,
  onToggleSelect,
}: GameRowProps) {
  const result = resultColor(game.result);
  const white = game.white?.name ?? "White";
  const black = game.black?.name ?? "Black";
  const wRating = game.white?.rating;
  const bRating = game.black?.rating;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderRadius: "14px",
        border: selected
          ? `1.5px solid ${CC.green}`
          : `1px solid ${isDark ? CC.border : CC.lBorder}`,
        backgroundColor: selected
          ? isDark ? CC.greenMuted : "#e8f2de"
          : isDark ? CC.bg3 : "#fafaf8",
        transition: "all 150ms cubic-bezier(0.0,0,0.2,1)",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: selected
            ? isDark ? "#33481f" : "#e0ecd6"
            : isDark ? CC.bg4 : "#f0ede8",
          transform: "translateY(-1px)",
          boxShadow: isDark
            ? "0 4px 16px rgba(0,0,0,0.4)"
            : "0 4px 16px rgba(0,0,0,0.08)",
        },
      }}
      onClick={onToggleSelect}
    >
      {/* Checkbox area */}
      <Box
        sx={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: `2px solid ${selected ? CC.green : isDark ? CC.bg5 : "#c0bab4"}`,
          backgroundColor: selected ? CC.green : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 150ms ease-out",
        }}
      >
        {selected && (
          <Icon icon="mdi:check" width={12} color="#fff" />
        )}
      </Box>

      {/* White player */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
        <PlayerAvatar name={white} isDark={isDark} />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: isDark ? CC.text : CC.lText,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {white}
          </Typography>
          {wRating && (
            <Typography sx={{ fontSize: 11, color: isDark ? CC.textMuted : "#8a8480", lineHeight: 1 }}>
              {wRating}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Result badge */}
      <Box
        sx={{
          px: 1.5,
          py: 0.5,
          borderRadius: "100px",
          backgroundColor: result.bg,
          flexShrink: 0,
          minWidth: 48,
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: result.text, letterSpacing: "0.3px" }}>
          {result.label}
        </Typography>
      </Box>

      {/* Black player */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1, justifyContent: "flex-end" }}>
        <Box sx={{ minWidth: 0, textAlign: "right" }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: isDark ? CC.text : CC.lText,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {black}
          </Typography>
          {bRating && (
            <Typography sx={{ fontSize: 11, color: isDark ? CC.textMuted : "#8a8480", lineHeight: 1 }}>
              {bRating}
            </Typography>
          )}
        </Box>
        <PlayerAvatar name={black} isDark={isDark} />
      </Box>

      {/* Meta */}
      <Box sx={{ display: { xs: "none", sm: "flex" }, flexDirection: "column", alignItems: "flex-end", flexShrink: 0, minWidth: 100 }}>
        {game.event && (
          <Typography
            sx={{ fontSize: 11, color: isDark ? CC.textSub : CC.lTextSub, fontWeight: 500, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }}
            title={game.event}
          >
            {game.event}
          </Typography>
        )}
        <Typography sx={{ fontSize: 11, color: isDark ? CC.textMuted : "#8a8480", lineHeight: 1.3 }}>
          {game.date ?? "—"}
        </Typography>
        {game.folder && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
            <Icon icon="material-symbols:folder-outline" width={10} color={CC.textMuted} />
            <Typography sx={{ fontSize: 10, color: isDark ? CC.textMuted : "#8a8480" }}>{game.folder}</Typography>
          </Box>
        )}
      </Box>

      {/* Actions */}
      <Box
        sx={{ display: "flex", gap: 0.25, flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip title="Analyze">
          <IconButton size="small" onClick={onAnalyze} sx={{ color: isDark ? CC.textSub : CC.lTextSub }}>
            <Icon icon="streamline:magnifying-glass-solid" width={15} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Move to folder">
          <IconButton size="small" onClick={onFolder} sx={{ color: isDark ? CC.textSub : CC.lTextSub }}>
            <Icon icon="material-symbols:folder-outline" width={15} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Copy PGN">
          <IconButton size="small" onClick={onCopy} sx={{ color: isDark ? CC.textSub : CC.lTextSub }}>
            <Icon icon="ri:clipboard-line" width={15} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={onDelete} sx={{ color: "#c45c5c" }}>
            <Icon icon="mdi:delete-outline" width={15} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default function GameDatabase() {
  const { games, deleteGame, moveGameToFolder } = useGameDatabase(true);
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [selectedFolder, setSelectedFolder] = useState<string>(ALL_FOLDER);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuGameId, setMenuGameId] = useState<number | null>(null);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [pendingFolderGameId, setPendingFolderGameId] = useState<number | null>(null);

  const folders = useMemo(() => {
    const names = new Set<string>();
    for (const g of games) if (g.folder) names.add(g.folder);
    return Array.from(names).sort();
  }, [games]);

  const filteredGames = useMemo(() => {
    if (selectedFolder === ALL_FOLDER) return games;
    if (selectedFolder === NO_FOLDER) return games.filter((g) => !g.folder);
    return games.filter((g) => g.folder === selectedFolder);
  }, [games, selectedFolder]);

  const hasUnfolderedGames = useMemo(() => games.some((g) => !g.folder), [games]);

  const toggleSelect = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const closeFolderMenu = () => { setMenuAnchor(null); setMenuGameId(null); };
  const closeBulkMenu = () => setBulkMenuAnchor(null);

  const handleMoveToFolder = async (folder: string | undefined) => {
    if (menuGameId === null) return;
    await moveGameToFolder(menuGameId, folder);
    closeFolderMenu();
  };

  const handleBulkMoveToFolder = async (folder: string | undefined) => {
    await Promise.all([...selected].map((id) => moveGameToFolder(id, folder)));
    closeBulkMenu();
  };

  const handleOpenNewFolder = (isBulk = false) => {
    if (isBulk) { setPendingFolderGameId(null); closeBulkMenu(); }
    else { setPendingFolderGameId(menuGameId); closeFolderMenu(); }
    setNewFolderName("");
    setNewFolderOpen(true);
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) { setNewFolderOpen(false); return; }
    if (pendingFolderGameId !== null) {
      await moveGameToFolder(pendingFolderGameId, name);
    } else {
      await Promise.all([...selected].map((id) => moveGameToFolder(id, name)));
    }
    setSelectedFolder(name);
    setNewFolderOpen(false);
  };

  const menuGame = menuGameId !== null ? games.find((g) => g.id === menuGameId) : null;

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pt: 3, pb: 4 }}>
      <PageTitle title="Chesskit Game Database" />

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h2" sx={{ mb: 0.5, color: isDark ? CC.text : CC.lText }}>
          My Games
        </Typography>
        <Typography sx={{ color: isDark ? CC.textSub : CC.lTextSub, fontSize: 14 }}>
          {games.length} game{games.length !== 1 && "s"} in your database
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>

        {/* Folder sidebar */}
        <Box
          sx={{
            width: 210,
            flexShrink: 0,
            backgroundColor: isDark ? CC.bg2 : "#ffffff",
            borderRadius: "16px",
            border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
            overflow: "hidden",
            boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.35)" : "0 4px 16px rgba(0,0,0,0.07)",
          }}
        >
          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            <Typography
              sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: isDark ? CC.textMuted : "#a0a09e" }}
            >
              Folders
            </Typography>
          </Box>

          <List dense disablePadding sx={{ px: 1, pb: 1 }}>
            {[
              { key: ALL_FOLDER, label: "All games", icon: "material-symbols:database-outline", count: games.length },
              ...(hasUnfolderedGames ? [{ key: NO_FOLDER, label: "No folder", icon: "material-symbols:folder-off-outline", count: games.filter((g) => !g.folder).length }] : []),
            ].map(({ key, label, icon, count }) => (
              <ListItemButton
                key={key}
                selected={selectedFolder === key}
                onClick={() => setSelectedFolder(key)}
                sx={{ borderRadius: "10px", mb: 0.25 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Icon icon={icon} width={16} color={selectedFolder === key ? CC.green : undefined} />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{ fontSize: 13, fontWeight: selectedFolder === key ? 700 : 500 }}
                />
                <Typography sx={{ fontSize: 11, color: isDark ? CC.textMuted : "#a0a09e", fontWeight: 600 }}>
                  {count}
                </Typography>
              </ListItemButton>
            ))}

            {folders.length > 0 && <Divider sx={{ my: 0.75 }} />}

            {folders.map((name) => (
              <ListItemButton
                key={name}
                selected={selectedFolder === name}
                onClick={() => setSelectedFolder(name)}
                sx={{ borderRadius: "10px", mb: 0.25 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Icon
                    icon="material-symbols:folder-outline"
                    width={16}
                    color={selectedFolder === name ? CC.green : undefined}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={name}
                  primaryTypographyProps={{ fontSize: 13, fontWeight: selectedFolder === name ? 700 : 500, noWrap: true }}
                />
                <Typography sx={{ fontSize: 11, color: isDark ? CC.textMuted : "#a0a09e", fontWeight: 600 }}>
                  {games.filter((g) => g.folder === name).length}
                </Typography>
              </ListItemButton>
            ))}
          </List>
        </Box>

        {/* Main content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Toolbar */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1.5, flexWrap: "wrap" }}>
            <LoadGameButton />

            <Box sx={{ flex: 1 }} />

            {selected.size > 0 && (
              <>
                <Chip
                  label={`${selected.size} selected`}
                  size="small"
                  sx={{
                    backgroundColor: alpha(CC.green, isDark ? 0.2 : 0.12),
                    color: CC.greenHover,
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Icon icon="material-symbols:folder-outline" width={14} />}
                  onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
                  sx={{ fontSize: 13 }}
                >
                  Move to folder
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<Icon icon="mdi:delete-outline" width={14} />}
                  onClick={async () => {
                    await Promise.all([...selected].map(deleteGame));
                    setSelected(new Set());
                  }}
                  sx={{ fontSize: 13 }}
                >
                  Delete ({selected.size})
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setSelected(new Set())}
                  sx={{ fontSize: 12, color: isDark ? CC.textSub : CC.lTextSub }}
                >
                  Clear
                </Button>
              </>
            )}
          </Box>

          {/* Section label */}
          {selectedFolder !== ALL_FOLDER && (
            <Typography
              sx={{ fontSize: 13, color: isDark ? CC.textSub : CC.lTextSub, mb: 1.5, fontWeight: 500 }}
            >
              {filteredGames.length} game{filteredGames.length !== 1 && "s"}
              {selectedFolder !== NO_FOLDER ? ` in "${selectedFolder}"` : " without a folder"}
            </Typography>
          )}

          {/* Game cards */}
          {filteredGames.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 8,
                backgroundColor: isDark ? CC.bg2 : "#ffffff",
                borderRadius: "16px",
                border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
              }}
            >
              <Icon icon="streamline:database" width={48} color={isDark ? CC.textMuted : "#c0bab4"} />
              <Typography sx={{ mt: 2, fontSize: 16, fontWeight: 600, color: isDark ? CC.textSub : CC.lTextSub }}>
                No games found
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: 13, color: isDark ? CC.textMuted : "#a0a09e" }}>
                Add games using the button above
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {filteredGames.map((game) => (
                <GameRow
                  key={game.id}
                  game={game}
                  isDark={isDark}
                  selected={selected.has(game.id)}
                  onToggleSelect={() => toggleSelect(game.id)}
                  onAnalyze={() => router.push({ pathname: "/", query: { gameId: game.id } })}
                  onFolder={(e) => { setMenuAnchor(e.currentTarget); setMenuGameId(game.id); }}
                  onDelete={async () => { await deleteGame(game.id); setSelected((p) => { const n = new Set(p); n.delete(game.id); return n; }); }}
                  onCopy={() => navigator.clipboard?.writeText?.(game.pgn)}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Bulk folder menu */}
      <Menu anchorEl={bulkMenuAnchor} open={!!bulkMenuAnchor} onClose={closeBulkMenu}>
        {folders.map((name) => (
          <MenuItem key={name} onClick={() => handleBulkMoveToFolder(name)}>
            <Icon icon="material-symbols:folder-outline" width={16} style={{ marginRight: 8 }} />
            {name}
          </MenuItem>
        ))}
        {folders.length > 0 && <Divider />}
        <MenuItem onClick={() => handleOpenNewFolder(true)}>
          <Icon icon="material-symbols:create-new-folder-outline" width={16} style={{ marginRight: 8 }} />
          New folder…
        </MenuItem>
        <MenuItem onClick={() => handleBulkMoveToFolder(undefined)}>
          <Icon icon="material-symbols:folder-off-outline" width={16} style={{ marginRight: 8 }} />
          Remove from folder
        </MenuItem>
      </Menu>

      {/* Single-game folder menu */}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeFolderMenu}>
        {folders.map((name) => (
          <MenuItem key={name} onClick={() => handleMoveToFolder(name)} selected={menuGame?.folder === name}>
            <Icon icon="material-symbols:folder-outline" width={16} style={{ marginRight: 8 }} />
            {name}
          </MenuItem>
        ))}
        {folders.length > 0 && <Divider />}
        <MenuItem onClick={() => handleOpenNewFolder(false)}>
          <Icon icon="material-symbols:create-new-folder-outline" width={16} style={{ marginRight: 8 }} />
          New folder…
        </MenuItem>
        {menuGame?.folder && (
          <MenuItem onClick={() => handleMoveToFolder(undefined)}>
            <Icon icon="material-symbols:folder-off-outline" width={16} style={{ marginRight: 8 }} />
            Remove from folder
          </MenuItem>
        )}
      </Menu>

      {/* New folder dialog */}
      <Dialog open={newFolderOpen} onClose={() => setNewFolderOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button variant="text" onClick={() => setNewFolderOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
