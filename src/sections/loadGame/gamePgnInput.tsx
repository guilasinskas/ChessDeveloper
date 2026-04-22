import { FormControl, TextField, Button, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import React, { useMemo } from "react";

interface Props {
  pgn: string;
  setPgn: (pgn: string) => void;
}

export default function GamePgnInput({ pgn, setPgn }: Props) {
  const gameCount = useMemo(() => {
    if (!pgn.trim()) return 0;
    return pgn.split(/\n(?=\[Event )/).filter((b) => b.trim().length > 0)
      .length;
  }, [pgn]);

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const readers = files.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) ?? "");
          reader.readAsText(file);
        })
    );

    Promise.all(readers).then((contents) => {
      setPgn(contents.join("\n\n"));
    });
  };

  return (
    <FormControl fullWidth>
      <TextField
        label="Enter PGN here..."
        variant="outlined"
        multiline
        value={pgn}
        onChange={(e) => setPgn(e.target.value)}
        rows={8}
        sx={{ mb: 1 }}
      />
      {gameCount > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          {gameCount} game{gameCount !== 1 ? "s" : ""} detected
        </Typography>
      )}
      <Button
        variant="contained"
        component="label"
        startIcon={<Icon icon="material-symbols:upload" />}
      >
        Upload PGN {`File${""}`}s
        <input
          type="file"
          hidden
          accept=".pgn"
          multiple
          onChange={handleFilesChange}
        />
      </Button>
    </FormControl>
  );
}
