export interface NoteImage {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  fen?: string;
  gameId?: number;
  repertoireId?: number;
  repertoireNodeId?: string;
  tags: string[];
  imageIds: string[];
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export type NewNote = Omit<Note, "id" | "createdAt" | "updatedAt">;

export interface NoteUpdate {
  title?: string;
  content?: string;
  fen?: string;
  gameId?: number;
  repertoireId?: number;
  repertoireNodeId?: string;
  tags?: string[];
  imageIds?: string[];
  color?: string;
}

export interface UploadImagePayload {
  filename: string;
  mimeType: string;
  dataBase64: string;
}
