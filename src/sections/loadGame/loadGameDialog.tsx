import { useGameDatabase } from "@/hooks/useGameDatabase";
import { getGamePgnPairs } from "@/lib/chess";
import { GameOrigin } from "@/types/enums";
import {
  MenuItem,
  Select,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  OutlinedInput,
  DialogActions,
  Grid2 as Grid,
  Snackbar,
  Alert,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  TextField,
  LinearProgress,
  Box,
  Typography,
} from "@mui/material";
import { Chess } from "chess.js";
import { useRef, useState, useMemo, useEffect } from "react";
import GamePgnInput from "./gamePgnInput";
import ChessComInput from "./chessComInput";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import LichessInput from "./lichessInput";
import { useSetAtom } from "jotai";
import { boardOrientationAtom } from "../analysis/states";

interface Props {
  open: boolean;
  onClose: () => void;
  setGame?: (game: Chess, originalPgn?: string) => Promise<void>;
}

const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

export default function NewGameDialog({ open, onClose, setGame }: Props) {
  const [pgn, setPgn] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [gameOrigin, setGameOrigin] = useLocalStorage(
    "preferred-game-origin",
    GameOrigin.ChessCom
  );
  const [parsingError, setParsingError] = useState("");
  const parsingErrorTimeout = useRef<NodeJS.Timeout | null>(null);
  const setBoardOrientation = useSetAtom(boardOrientationAtom);
  const { addGame, addGames, importPgnFile } = useGameDatabase();

  const [useFolder, setUseFolder] = useState(false);
  const [folder, setFolder] = useState("");
  const [existingFolders, setExistingFolders] = useState<string[]>([]);

  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [importProgress, setImportProgress] = useState<{
    sent: number;
    total: number;
  } | null>(null);
  const importAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open || setGame) return;
    let cancelled = false;
    fetch("/api/games?light=1&limit=0")
      .then((r) => r.json())
      .then((data: { folders?: { name: string }[] }) => {
        if (cancelled) return;
        const names = (data.folders ?? []).map((f) => f.name);
        setExistingFolders(names);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, setGame]);

  const pgnGameCount = useMemo(() => {
    if (!pgn.trim()) return 0;
    return pgn.split(/\n(?=\[Event )/).filter((b) => b.trim().length > 0)
      .length;
  }, [pgn]);

  const totalFileBytes = useMemo(
    () => files.reduce((s, f) => s + f.size, 0),
    [files]
  );

  const handleImportFiles = async () => {
    if (files.length === 0) return;
    const folderToUse = useFolder ? folder.trim() || undefined : undefined;
    const controller = new AbortController();
    importAbortRef.current = controller;
    setImporting(true);
    setImportProgress({ sent: 0, total: totalFileBytes });

    let totalImported = 0;
    let totalSkipped = 0;
    let bytesSentBefore = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setImportStatus(`Uploading ${file.name} (${i + 1}/${files.length})…`);
        const result = await importPgnFile(file, {
          folder: folderToUse,
          signal: controller.signal,
          onProgress: (sent) => {
            setImportProgress({
              sent: bytesSentBefore + sent,
              total: totalFileBytes,
            });
          },
        });
        totalImported += result.imported;
        totalSkipped += result.skipped;
        bytesSentBefore += file.size;
        setImportProgress({ sent: bytesSentBefore, total: totalFileBytes });
      }
      setImportStatus(
        `Imported ${totalImported} game${totalImported !== 1 ? "s" : ""}` +
          (totalSkipped > 0 ? ` (${totalSkipped} skipped)` : "")
      );
      setBoardOrientation(true);
      // Brief delay so the user can read the success summary.
      setTimeout(() => handleClose(), 800);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        setImportStatus("Import cancelled");
      } else {
        console.error(err);
        setParsingError(
          err instanceof Error ? `${err.message} !` : "Import failed !"
        );
      }
    } finally {
      setImporting(false);
      importAbortRef.current = null;
    }
  };

  const handleAddGame = async (pgn: string, boardOrientation?: boolean) => {
    if (!pgn) return;

    try {
      // Parse into (Chess, rawBlock) pairs so the raw PGN block — including
      // variations, comments and NAGs that chess.js drops on round-trip —
      // is what we actually persist.
      const pairs = getGamePgnPairs(pgn);
      if (pairs.length === 0) throw new Error("No valid games in PGN");

      if (setGame) {
        await setGame(pairs[0].game, pairs[0].pgn);
      } else {
        const folderToUse = useFolder ? folder.trim() || undefined : undefined;
        if (pairs.length === 1) {
          await addGame(pairs[0].game, folderToUse, pairs[0].pgn);
        } else {
          await addGames(
            pairs.map((p) => p.game),
            folderToUse,
            pairs.map((p) => p.pgn)
          );
        }
      }

      setBoardOrientation(boardOrientation ?? true);
      handleClose();
    } catch (error) {
      console.error(error);

      if (parsingErrorTimeout.current) {
        clearTimeout(parsingErrorTimeout.current);
      }

      setParsingError(
        error instanceof Error
          ? `${error.message} !`
          : "Invalid PGN: unknown error !"
      );

      parsingErrorTimeout.current = setTimeout(() => {
        setParsingError("");
      }, 3000);
    }
  };

  const handleClose = () => {
    if (importing) {
      importAbortRef.current?.abort();
    }
    setPgn("");
    setFiles([]);
    setParsingError("");
    setUseFolder(false);
    setFolder("");
    setImportStatus("");
    setImportProgress(null);
    if (parsingErrorTimeout.current) {
      clearTimeout(parsingErrorTimeout.current);
    }
    onClose();
  };

  const isPgnTab = gameOrigin === GameOrigin.Pgn;
  const hasFilesToImport = isPgnTab && files.length > 0 && !setGame;
  const pgnButtonLabel = hasFilesToImport
    ? `Import ${formatBytes(totalFileBytes)}`
    : !setGame && pgnGameCount > 1
      ? `Add ${pgnGameCount} games`
      : "Add";

  return (
    <Dialog
      open={open}
      onClose={importing ? undefined : handleClose}
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            position: "fixed",
            top: 0,
            width: "calc(100% - 10px)",
            marginY: { xs: "3vh", sm: 5 },
            maxHeight: { xs: "calc(100% - 5vh)", sm: "calc(100% - 64px)" },
            borderRadius: "var(--cc-radius-xl)",
            boxShadow: "var(--cc-shadow-ambient)",
            border: "1px solid var(--cc-outline-variant)",
            overflow: "hidden",
          },
        },
        backdrop: {
          sx: {
            backgroundColor:
              "color-mix(in srgb, var(--cc-inverse-surface) 40%, transparent)",
            backdropFilter: "blur(4px)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: "var(--cc-font-headline)",
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          color: "var(--cc-primary)",
          px: { xs: 3, md: 4 },
          pt: 3,
          pb: 1,
        }}
      >
        {setGame ? "Load a game" : "Add games to your database"}
      </DialogTitle>
      <DialogContent sx={{ padding: { xs: 2, md: 3 } }}>
        <Grid
          container
          marginTop={1}
          alignItems="center"
          justifyContent="start"
          rowGap={2}
        >
          <FormControl sx={{ my: 1, mr: 2, width: 150 }}>
            <InputLabel id="dialog-select-label">Game origin</InputLabel>
            <Select
              labelId="dialog-select-label"
              id="dialog-select"
              displayEmpty
              input={<OutlinedInput label="Game origin" />}
              value={gameOrigin ?? ""}
              onChange={(e) => {
                setGameOrigin(e.target.value as GameOrigin);
                setParsingError("");
              }}
            >
              {Object.entries(gameOriginLabel).map(([origin, label]) => (
                <MenuItem key={origin} value={origin}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {gameOrigin === GameOrigin.Pgn && (
            <GamePgnInput
              pgn={pgn}
              setPgn={setPgn}
              files={files}
              setFiles={setFiles}
            />
          )}

          {gameOrigin === GameOrigin.ChessCom && (
            <ChessComInput onSelect={handleAddGame} />
          )}

          {gameOrigin === GameOrigin.Lichess && (
            <LichessInput onSelect={handleAddGame} />
          )}

          {!setGame && (
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useFolder}
                    onChange={(e) => setUseFolder(e.target.checked)}
                  />
                }
                label="Save imported games to a folder"
              />
              {useFolder && (
                <Autocomplete
                  freeSolo
                  options={existingFolders}
                  inputValue={folder}
                  onInputChange={(_, v) => setFolder(v)}
                  sx={{ mt: 1, width: { xs: "100%", sm: 320 } }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Folder name"
                      variant="outlined"
                      placeholder="Pick existing or type a new one"
                    />
                  )}
                />
              )}
            </Grid>
          )}

          {(importing || importStatus) && (
            <Grid size={12}>
              <Box sx={{ mt: 1 }}>
                {importing && importProgress && (
                  <LinearProgress
                    variant={
                      importProgress.total > 0 ? "determinate" : "indeterminate"
                    }
                    value={
                      importProgress.total > 0
                        ? Math.min(
                            100,
                            (importProgress.sent / importProgress.total) * 100
                          )
                        : undefined
                    }
                    sx={{ mb: 1 }}
                  />
                )}
                {importStatus && (
                  <Typography variant="caption" color="text.secondary">
                    {importStatus}
                  </Typography>
                )}
              </Box>
            </Grid>
          )}

          <Snackbar open={!!parsingError}>
            <Alert
              onClose={() => setParsingError("")}
              severity="error"
              variant="filled"
              sx={{ width: "100%" }}
            >
              {parsingError}
            </Alert>
          </Snackbar>
        </Grid>
      </DialogContent>
      <DialogActions
        sx={{
          px: { xs: 3, md: 4 },
          py: 2.5,
          gap: 2,
          backgroundColor: "var(--cc-surface-container-low)",
          borderTop: "1px solid var(--cc-outline-variant)",
        }}
      >
        <Button
          variant="text"
          onClick={handleClose}
          disabled={importing && !importAbortRef.current}
          sx={{
            color: "var(--cc-on-surface-variant)",
            fontWeight: 700,
            fontSize: 13,
            textTransform: "none",
            "&:hover": {
              backgroundColor: "transparent",
              color: "var(--cc-primary)",
            },
          }}
        >
          {importing ? "Cancel import" : "Cancel"}
        </Button>
        {gameOrigin === GameOrigin.Pgn && (
          <Button
            variant="contained"
            disabled={
              importing ||
              (hasFilesToImport ? false : !pgn.trim() && files.length === 0)
            }
            onClick={() => {
              if (hasFilesToImport) {
                handleImportFiles();
              } else {
                handleAddGame(pgn);
              }
            }}
            sx={{
              borderRadius: "var(--cc-radius-pill)",
              px: 3.5,
              py: 1.25,
              fontWeight: 700,
              fontSize: 13,
              textTransform: "none",
              boxShadow: "var(--cc-shadow-soft)",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "var(--cc-shadow-ambient)",
              },
              transition: "transform 120ms, box-shadow 120ms",
            }}
          >
            {pgnButtonLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

const gameOriginLabel: Record<GameOrigin, string> = {
  [GameOrigin.ChessCom]: "Chess.com",
  [GameOrigin.Lichess]: "Lichess.org",
  [GameOrigin.Pgn]: "PGN",
};
