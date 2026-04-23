import { NewNote, Note, NoteUpdate } from "@/types/notes";
import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

const DATA_PATH = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, "notes.json")
  : path.join(process.cwd(), "data", "notes.json");

const readNotes = (): Note[] => {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, "[]", "utf-8");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")) as Note[];
  } catch {
    return [];
  }
};

const writeNotes = (items: Note[]) => {
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2), "utf-8");
};

const sanitizeNew = (n: Partial<NewNote>): NewNote => ({
  title: n.title ?? "",
  content: n.content ?? "",
  fen: n.fen,
  gameId: n.gameId,
  repertoireId: n.repertoireId,
  repertoireNodeId: n.repertoireNodeId,
  tags: Array.isArray(n.tags) ? n.tags : [],
  imageIds: Array.isArray(n.imageIds) ? n.imageIds : [],
  color: n.color,
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json(readNotes());
  }

  if (req.method === "POST") {
    const items = readNotes();
    const body = req.body as Partial<NewNote>;

    const maxId = items.length > 0 ? Math.max(...items.map((g) => g.id)) : 0;
    const now = new Date().toISOString();
    const added: Note = {
      ...sanitizeNew(body),
      id: maxId + 1,
      createdAt: now,
      updatedAt: now,
    };

    writeNotes([...items, added]);
    return res.status(201).json(added);
  }

  if (req.method === "PUT") {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const items = readNotes();
    const idx = items.findIndex((g) => g.id === id);
    if (idx === -1) return res.status(404).json({ error: "Note not found" });

    const update = req.body as NoteUpdate;
    items[idx] = {
      ...items[idx],
      ...update,
      updatedAt: new Date().toISOString(),
    };
    writeNotes(items);
    return res.status(200).json(items[idx]);
  }

  if (req.method === "DELETE") {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const items = readNotes();
    writeNotes(items.filter((g) => g.id !== id));
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
