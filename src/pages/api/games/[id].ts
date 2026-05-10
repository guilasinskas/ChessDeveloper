import { readGame } from "@/lib/server/gameStorage";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const game = await readGame(id);
  if (!game) return res.status(404).json({ error: "Game not found" });
  return res.status(200).json(game);
}
