import { FormControl, TextField, Button, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import React, { useMemo } from "react";

interface Props {
  pgn: string;
  setPgn: (pgn: string) => void;
  files: File[];
  setFiles: (files: File[]) => void;
}

const FILE_TEXT_INLINE_LIMIT_BYTES = 1_000_000; // 1 MB

const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

export default function GamePgnInput({ pgn, setPgn, files, setFiles }: Props) {
  const pastedGameCount = useMemo(() => {
    if (!pgn.trim()) return 0;
    return pgn.split(/\n(?=\[Event )/).filter((b) => b.trim().length > 0)
      .length;
  }, [pgn]);

  const totalFileBytes = useMemo(
    () => files.reduce((s, f) => s + f.size, 0),
    [files]
  );

  const handleFilesChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = ""; // allow picking the same file twice
    if (picked.length === 0) return;

    const totalSize = picked.reduce((s, f) => s + f.size, 0);

    // For tiny pastable files keep the existing inline-text flow so the user
    // can preview/edit. For anything larger we keep references to the File
    // objects and let the dialog stream them up via /api/games/import.
    if (totalSize <= FILE_TEXT_INLINE_LIMIT_BYTES && picked.length <= 5) {
      const contents = await Promise.all(
        picked.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) =>
                resolve((e.target?.result as string) ?? "");
              reader.readAsText(file);
            })
        )
      );
      setPgn(contents.join("\n\n"));
      setFiles([]);
      return;
    }

    setPgn("");
    setFiles(picked);
  };

  const showPastedCount = pastedGameCount > 0 && files.length === 0;
  const showFilesSummary = files.length > 0;

  return (
    <FormControl fullWidth>
      <TextField
        label={
          files.length > 0
            ? "Streaming upload selected — text input disabled"
            : "Enter PGN here..."
        }
        variant="outlined"
        multiline
        value={files.length > 0 ? "" : pgn}
        disabled={files.length > 0}
        onChange={(e) => setPgn(e.target.value)}
        rows={8}
        sx={{ mb: 1 }}
      />
      {showPastedCount && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          {pastedGameCount} game{pastedGameCount !== 1 ? "s" : ""} detected
        </Typography>
      )}
      {showFilesSummary && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          {files.length} file{files.length !== 1 ? "s" : ""} ready to stream —{" "}
          {formatBytes(totalFileBytes)}
        </Typography>
      )}
      <Button
        variant="contained"
        component="label"
        startIcon={<Icon icon="material-symbols:upload" />}
      >
        Upload PGN Files
        <input
          type="file"
          hidden
          accept=".pgn"
          multiple
          onChange={handleFilesChange}
        />
      </Button>
      {showFilesSummary && (
        <Button
          variant="text"
          size="small"
          onClick={() => setFiles([])}
          sx={{ mt: 0.5 }}
        >
          Clear selection
        </Button>
      )}
    </FormControl>
  );
}
