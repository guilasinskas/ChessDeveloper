import { Game } from "@/types/game";
import {
  appendGames,
  deleteByFolder,
  deleteGame,
  readAllFull,
  readFiltered,
  updateGame,
} from "@/lib/server/gameStorage";
import { NextApiRequest, NextApiResponse } from "next";

// Larger payload cap so a single bulk POST (used by the in-app analysis save
// path with multiple games) doesn't trip the default 1MB limit. For really
// large PGN imports the dedicated /api/games/import streaming endpoint should
// be used instead — it has bodyParser disabled.
export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    if (req.query.include === "pgn") {
      return res.status(200).json(await readAllFull());
    }

    const parseNum = (v: unknown): number | undefined => {
      if (typeof v !== "string" || v === "") return undefined;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    };

    const result = await readFiltered({
      folder:
        typeof req.query.folder === "string" ? req.query.folder : undefined,
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      limit: parseNum(req.query.limit),
      offset: parseNum(req.query.offset),
      light: req.query.light === "1" || req.query.light === "true",
    });
    return res.status(200).json(result);
  }

  if (req.method === "POST") {
    const body = req.body as Omit<Game, "id"> | Omit<Game, "id">[];
    const newGames = Array.isArray(body) ? body : [body];
    const added = await appendGames(newGames);
    return res.status(201).json(added);
  }

  if (req.method === "PUT") {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const updated = await updateGame(id, req.body);
    if (!updated) return res.status(404).json({ error: "Game not found" });
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    // Bulk: ?folder=NAME deletes every game in that folder. Use "__none__"
    // for unfoldered games or "*" for the whole library. Returns the count
    // of games actually removed so the client can confirm the operation.
    if (typeof req.query.folder === "string" && req.query.folder.length > 0) {
      const deleted = await deleteByFolder(req.query.folder);
      return res.status(200).json({ success: true, deleted });
    }

    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    await deleteGame(id);
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", "GET, POST, PUT, DELETE");
  res.status(405).json({ error: "Method not allowed" });
}
