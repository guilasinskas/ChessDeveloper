import { formatPgnToDatabase } from "@/lib/chess";
import { withBulkImport } from "@/lib/server/gameStorage";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

const BLOCK_BOUNDARY = /\r?\n(?=\[Event )/;

const processBlock = (
  block: string,
  folder: string | undefined,
  add: (g: ReturnType<typeof formatPgnToDatabase>) => number
): boolean => {
  const trimmed = block.trim();
  if (!trimmed) return false;
  // Require at least one tag pair to avoid storing junk between games.
  if (!/^\[\w+\s+"/.test(trimmed)) return false;
  try {
    const formatted = formatPgnToDatabase(trimmed);
    add(folder ? { ...formatted, folder } : formatted);
    return true;
  } catch {
    return false;
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const folderRaw = req.query.folder;
  const folder =
    typeof folderRaw === "string" && folderRaw.trim().length > 0
      ? folderRaw.trim()
      : undefined;

  let imported = 0;
  let skipped = 0;
  let firstId: number | undefined;
  let lastId: number | undefined;

  try {
    await withBulkImport(async ({ add }) => {
      const wrappedAdd = (g: ReturnType<typeof formatPgnToDatabase>) => {
        const id = add(g);
        if (firstId === undefined) firstId = id;
        lastId = id;
        imported++;
        return id;
      };

      let buffer = "";

      const handleChunk = (text: string) => {
        buffer += text;
        const parts = buffer.split(BLOCK_BOUNDARY);
        // last part may be incomplete — keep it in the buffer
        for (let i = 0; i < parts.length - 1; i++) {
          if (!processBlock(parts[i], folder, wrappedAdd)) {
            if (parts[i].trim().length > 0) skipped++;
          }
        }
        buffer = parts[parts.length - 1];
      };

      for await (const chunk of req) {
        handleChunk(
          typeof chunk === "string"
            ? chunk
            : Buffer.isBuffer(chunk)
              ? chunk.toString("utf-8")
              : Buffer.from(chunk as Uint8Array).toString("utf-8")
        );
      }

      if (buffer.trim()) {
        if (!processBlock(buffer, folder, wrappedAdd)) skipped++;
      }
    });
  } catch (err) {
    console.error("PGN import failed", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Import failed",
      imported,
      skipped,
      firstId,
      lastId,
    });
  }

  return res.status(200).json({ imported, skipped, firstId, lastId });
}
