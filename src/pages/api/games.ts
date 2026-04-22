import { Game } from "@/types/game";
import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

const DATA_PATH = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, "games.json")
  : path.join(process.cwd(), "data", "games.json");

const readGames = (): Game[] => {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, "[]", "utf-8");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")) as Game[];
  } catch {
    return [];
  }
};

const writeGames = (games: Game[]) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(games, null, 2), "utf-8");
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json(readGames());
  }

  if (req.method === "POST") {
    const games = readGames();
    const body = req.body as Omit<Game, "id"> | Omit<Game, "id">[];
    const newGames = Array.isArray(body) ? body : [body];

    const maxId = games.length > 0 ? Math.max(...games.map((g) => g.id)) : 0;
    const added: Game[] = newGames.map((g, i) => ({ ...g, id: maxId + i + 1 }));

    writeGames([...games, ...added]);
    return res.status(201).json(added);
  }

  if (req.method === "PUT") {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const games = readGames();
    const idx = games.findIndex((g) => g.id === id);
    if (idx === -1) return res.status(404).json({ error: "Game not found" });

    games[idx] = { ...games[idx], ...req.body };
    writeGames(games);
    return res.status(200).json(games[idx]);
  }

  if (req.method === "DELETE") {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const games = readGames();
    writeGames(games.filter((g) => g.id !== id));
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
