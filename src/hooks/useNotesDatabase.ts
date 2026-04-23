import {
  NewNote,
  Note,
  NoteImage,
  NoteUpdate,
  UploadImagePayload,
} from "@/types/notes";
import { atom, useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";

const notesAtom = atom<Note[]>([]);
const imagesAtom = atom<NoteImage[]>([]);
const fetchAtom = atom<boolean>(false);

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const noteImageUrl = (id: string) => `/api/notes/images?id=${id}`;

export const useNotesDatabase = (shouldFetch?: boolean) => {
  const [notes, setNotes] = useAtom(notesAtom);
  const [images, setImages] = useAtom(imagesAtom);
  const [fetchFlag, setFetchFlag] = useAtom(fetchAtom);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (shouldFetch !== undefined) {
      setFetchFlag(shouldFetch);
    }
  }, [shouldFetch, setFetchFlag]);

  const reload = useCallback(async () => {
    if (!fetchFlag) {
      if (shouldFetch === false || shouldFetch === undefined) {
        setIsReady(true);
      }
      return;
    }
    try {
      const [notesRes, imagesRes] = await Promise.all([
        fetch("/api/notes"),
        fetch("/api/notes/images"),
      ]);
      const [notesData, imagesData] = await Promise.all([
        notesRes.json() as Promise<Note[]>,
        imagesRes.json() as Promise<NoteImage[]>,
      ]);
      setNotes(notesData);
      setImages(imagesData);
    } catch (err) {
      console.error("Failed to load notes", err);
    } finally {
      setIsReady(true);
    }
  }, [fetchFlag, setNotes, setImages, shouldFetch]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addNote = useCallback(
    async (data: Partial<NewNote>) => {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create note");
      const added: Note = await res.json();
      setNotes((prev) => [...prev, added]);
      return added;
    },
    [setNotes]
  );

  const updateNote = useCallback(
    async (id: number, update: NoteUpdate) => {
      const res = await fetch(`/api/notes?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error("Failed to update note");
      const updated: Note = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      return updated;
    },
    [setNotes]
  );

  const deleteNote = useCallback(
    async (id: number) => {
      const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      setNotes((prev) => prev.filter((n) => n.id !== id));
    },
    [setNotes]
  );

  const uploadImage = useCallback(
    async (file: File): Promise<NoteImage> => {
      const dataBase64 = await fileToBase64(file);
      const payload: UploadImagePayload = {
        filename: file.name,
        mimeType: file.type || "image/png",
        dataBase64,
      };
      const res = await fetch("/api/notes/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to upload image");
      }
      const meta: NoteImage = await res.json();
      setImages((prev) => [...prev, meta]);
      return meta;
    },
    [setImages]
  );

  const deleteImage = useCallback(
    async (id: string) => {
      await fetch(`/api/notes/images?id=${id}`, { method: "DELETE" });
      setImages((prev) => prev.filter((i) => i.id !== id));
      setNotes((prev) =>
        prev.map((n) => ({
          ...n,
          imageIds: n.imageIds.filter((iid) => iid !== id),
        }))
      );
    },
    [setImages, setNotes]
  );

  return {
    notes,
    images,
    isReady,
    addNote,
    updateNote,
    deleteNote,
    uploadImage,
    deleteImage,
    reload,
  };
};
