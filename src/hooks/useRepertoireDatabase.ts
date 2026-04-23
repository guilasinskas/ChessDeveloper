import {
  NewRepertoire,
  Repertoire,
  RepertoireUpdate,
} from "@/types/openings";
import { atom, useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";

const repertoiresAtom = atom<Repertoire[]>([]);
const fetchRepertoiresAtom = atom<boolean>(false);

export const useRepertoireDatabase = (shouldFetch?: boolean) => {
  const [repertoires, setRepertoires] = useAtom(repertoiresAtom);
  const [fetchFlag, setFetchFlag] = useAtom(fetchRepertoiresAtom);
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
      const res = await fetch("/api/openings");
      const data: Repertoire[] = await res.json();
      setRepertoires(data);
    } catch (err) {
      console.error("Failed to load repertoires", err);
    } finally {
      setIsReady(true);
    }
  }, [fetchFlag, setRepertoires, shouldFetch]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addRepertoire = useCallback(
    async (data: NewRepertoire) => {
      const res = await fetch("/api/openings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create repertoire");
      const added: Repertoire = await res.json();
      setRepertoires((prev) => [...prev, added]);
      return added;
    },
    [setRepertoires]
  );

  const updateRepertoire = useCallback(
    async (id: number, update: RepertoireUpdate) => {
      const res = await fetch(`/api/openings?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error("Failed to update repertoire");
      const updated: Repertoire = await res.json();
      setRepertoires((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    },
    [setRepertoires]
  );

  const deleteRepertoire = useCallback(
    async (id: number) => {
      const res = await fetch(`/api/openings?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete repertoire");
      setRepertoires((prev) => prev.filter((r) => r.id !== id));
    },
    [setRepertoires]
  );

  const getRepertoire = useCallback(
    (id: number) => repertoires.find((r) => r.id === id),
    [repertoires]
  );

  return {
    repertoires,
    isReady,
    addRepertoire,
    updateRepertoire,
    deleteRepertoire,
    getRepertoire,
    reload,
  };
};
