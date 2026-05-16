/**
 * Per-folder custom cover image. The user can upload a custom image
 * to replace the default hash-picked photo on each database folder
 * card. Mapping lives in `data/folder-covers.json` and is keyed by
 * folder name (including the reserved __all__ and __none__ pseudo-
 * folders shown on the database page).
 */
export interface FolderCoverMeta {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  updatedAt: string;
}

export type FolderCoverMap = Record<string, FolderCoverMeta>;

export interface UploadFolderCoverPayload {
  folder: string;
  filename: string;
  mimeType: string;
  dataBase64: string;
}
