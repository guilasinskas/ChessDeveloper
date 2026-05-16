import {
  FolderCoverMap,
  FolderCoverMeta,
  UploadFolderCoverPayload,
} from "@/types/folderCover";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

const COVERS_KEY = ["folder-covers"] as const;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/**
 * URL for a folder's custom cover. The `updatedAt` ISO is appended so
 * the browser cache busts when the user uploads a new image (response
 * is sent with long max-age + immutable, by design — see the API).
 */
export const folderCoverUrl = (meta: FolderCoverMeta, folder: string): string =>
  `/api/folders/cover?folder=${encodeURIComponent(folder)}&v=${encodeURIComponent(
    meta.updatedAt
  )}`;

export function useFolderCovers() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: COVERS_KEY,
    queryFn: async (): Promise<FolderCoverMap> => {
      const res = await fetch("/api/folders/cover");
      if (!res.ok) throw new Error("Failed to load folder covers");
      return (await res.json()) as FolderCoverMap;
    },
    staleTime: 60_000,
  });

  const upload = useMutation({
    mutationFn: async ({
      folder,
      file,
    }: {
      folder: string;
      file: File;
    }): Promise<FolderCoverMeta & { folder: string }> => {
      const dataBase64 = await fileToBase64(file);
      const payload: UploadFolderCoverPayload = {
        folder,
        filename: file.name,
        mimeType: file.type || "image/png",
        dataBase64,
      };
      const res = await fetch("/api/folders/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to upload cover");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COVERS_KEY });
    },
  });

  const clear = useMutation({
    mutationFn: async (folder: string) => {
      const res = await fetch(
        `/api/folders/cover?folder=${encodeURIComponent(folder)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to remove cover");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COVERS_KEY });
    },
  });

  const getCoverUrl = useCallback(
    (folder: string): string | undefined => {
      const meta = data?.[folder];
      return meta ? folderCoverUrl(meta, folder) : undefined;
    },
    [data]
  );

  return {
    covers: data ?? {},
    getCoverUrl,
    uploadCover: (folder: string, file: File) =>
      upload.mutateAsync({ folder, file }),
    clearCover: (folder: string) => clear.mutateAsync(folder),
    isUploading: upload.isPending,
  };
}
