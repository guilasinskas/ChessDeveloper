import { NoteImage, UploadImagePayload } from "@/types/notes";
import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import crypto from "crypto";

const ROOT = process.env.DATA_DIR || path.join(process.cwd(), "data");
const INDEX_PATH = path.join(ROOT, "notes-images.json");
const IMAGES_DIR = path.join(ROOT, "notes-images");

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const MAX_SIZE_BYTES = 8 * 1024 * 1024;

const ensureDirs = () => {
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
  if (!fs.existsSync(INDEX_PATH)) {
    fs.writeFileSync(INDEX_PATH, "[]", "utf-8");
  }
};

const readIndex = (): NoteImage[] => {
  ensureDirs();
  try {
    return JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8")) as NoteImage[];
  } catch {
    return [];
  }
};

const writeIndex = (items: NoteImage[]) => {
  fs.writeFileSync(INDEX_PATH, JSON.stringify(items, null, 2), "utf-8");
};

const findFilePath = (id: string): string | null => {
  ensureDirs();
  const matches = fs
    .readdirSync(IMAGES_DIR)
    .filter((f) => f.startsWith(`${id}.`));
  if (matches.length === 0) return null;
  return path.join(IMAGES_DIR, matches[0]);
};

export const config = {
  api: { bodyParser: { sizeLimit: "12mb" } },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  ensureDirs();

  if (req.method === "GET") {
    const id = req.query.id as string | undefined;

    if (!id) {
      return res.status(200).json(readIndex());
    }

    const filePath = findFilePath(id);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Image not found" });
    }

    const meta = readIndex().find((i) => i.id === id);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const contentType =
      meta?.mimeType ||
      Object.entries(MIME_EXT).find(([, e]) => e === ext)?.[0] ||
      "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.status(200).send(fs.readFileSync(filePath));
  }

  if (req.method === "POST") {
    const body = req.body as UploadImagePayload;
    if (!body?.dataBase64 || !body?.mimeType) {
      return res.status(400).json({ error: "Missing data or mimeType" });
    }

    const ext = MIME_EXT[body.mimeType.toLowerCase()];
    if (!ext) {
      return res.status(400).json({ error: "Unsupported mime type" });
    }

    const base64 = body.dataBase64.includes(",")
      ? body.dataBase64.split(",")[1]
      : body.dataBase64;

    const buffer = Buffer.from(base64, "base64");
    if (buffer.byteLength > MAX_SIZE_BYTES) {
      return res
        .status(413)
        .json({ error: "File too large (max 8MB)" });
    }

    const id = crypto.randomBytes(8).toString("hex");
    const filePath = path.join(IMAGES_DIR, `${id}.${ext}`);
    fs.writeFileSync(filePath, buffer);

    const meta: NoteImage = {
      id,
      filename: body.filename || `image.${ext}`,
      mimeType: body.mimeType,
      size: buffer.byteLength,
      createdAt: new Date().toISOString(),
    };

    const index = readIndex();
    index.push(meta);
    writeIndex(index);

    return res.status(201).json(meta);
  }

  if (req.method === "DELETE") {
    const id = req.query.id as string;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const filePath = findFilePath(id);
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const index = readIndex();
    writeIndex(index.filter((i) => i.id !== id));

    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
