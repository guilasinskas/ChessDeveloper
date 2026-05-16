import {
  FolderCoverMap,
  FolderCoverMeta,
  UploadFolderCoverPayload,
} from "@/types/folderCover";
import crypto from "crypto";
import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

const ROOT = process.env.DATA_DIR || path.join(process.cwd(), "data");
const INDEX_PATH = path.join(ROOT, "folder-covers.json");
const IMAGES_DIR = path.join(ROOT, "folder-covers");

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_SIZE_BYTES = 8 * 1024 * 1024;

const ensureDirs = () => {
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
  if (!fs.existsSync(INDEX_PATH)) {
    fs.writeFileSync(INDEX_PATH, "{}", "utf-8");
  }
};

const readIndex = (): FolderCoverMap => {
  ensureDirs();
  try {
    return JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8")) as FolderCoverMap;
  } catch {
    return {};
  }
};

const writeIndex = (map: FolderCoverMap) => {
  fs.writeFileSync(INDEX_PATH, JSON.stringify(map, null, 2), "utf-8");
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
    const folder = req.query.folder as string | undefined;

    if (!folder) {
      return res.status(200).json(readIndex());
    }

    const meta = readIndex()[folder];
    if (!meta) return res.status(404).json({ error: "No cover for folder" });

    const filePath = findFilePath(meta.id);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Cover file missing" });
    }

    res.setHeader("Content-Type", meta.mimeType);
    // Bust cache on every update via the updatedAt query param the client appends.
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.status(200).send(fs.readFileSync(filePath));
  }

  if (req.method === "POST") {
    const body = req.body as UploadFolderCoverPayload;
    if (!body?.folder || !body?.dataBase64 || !body?.mimeType) {
      return res
        .status(400)
        .json({ error: "Missing folder, data or mimeType" });
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
      return res.status(413).json({ error: "File too large (max 8MB)" });
    }

    const map = readIndex();

    // Drop the previous file for this folder, if any — keep the directory tidy.
    const previous = map[body.folder];
    if (previous) {
      const prev = findFilePath(previous.id);
      if (prev) {
        try {
          fs.unlinkSync(prev);
        } catch {
          /* ignore */
        }
      }
    }

    const id = crypto.randomBytes(8).toString("hex");
    const filePath = path.join(IMAGES_DIR, `${id}.${ext}`);
    fs.writeFileSync(filePath, buffer);

    const meta: FolderCoverMeta = {
      id,
      filename: body.filename || `cover.${ext}`,
      mimeType: body.mimeType,
      size: buffer.byteLength,
      updatedAt: new Date().toISOString(),
    };

    map[body.folder] = meta;
    writeIndex(map);

    return res.status(201).json({ folder: body.folder, ...meta });
  }

  if (req.method === "DELETE") {
    const folder = req.query.folder as string | undefined;
    if (!folder) return res.status(400).json({ error: "Missing folder" });

    const map = readIndex();
    const meta = map[folder];
    if (meta) {
      const filePath = findFilePath(meta.id);
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          /* ignore */
        }
      }
      delete map[folder];
      writeIndex(map);
    }

    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
