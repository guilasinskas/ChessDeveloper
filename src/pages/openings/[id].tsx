import { Box, Button, Typography, useTheme, CircularProgress } from "@mui/material";
import { Icon } from "@iconify/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CC } from "@/constants";
import { PageTitle } from "@/components/pageTitle";
import { useRepertoireDatabase } from "@/hooks/useRepertoireDatabase";
import { useAtomValue, useSetAtom } from "jotai";
import {
  repertoireBoardOrientationAtom,
  repertoireTreeAtom,
  studyColorAtom,
} from "@/sections/openings/states";
import { initializeRepertoireAction } from "@/sections/openings/actions";
import RepertoireBoard from "@/sections/openings/RepertoireBoard";
import MoveTree from "@/sections/openings/MoveTree";
import RepertoirePanel from "@/sections/openings/RepertoirePanel";
import NotesPanel from "@/sections/notes/NotesPanel";

export default function RepertoireEditorPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { id: idQuery } = router.query;
  const id = useMemo(
    () => (typeof idQuery === "string" ? parseInt(idQuery) : NaN),
    [idQuery]
  );
  const { getRepertoire, updateRepertoire, isReady } =
    useRepertoireDatabase(true);

  const repertoire = !isNaN(id) ? getRepertoire(id) : undefined;

  const tree = useAtomValue(repertoireTreeAtom);
  const initializeRepertoire = useSetAtom(initializeRepertoireAction);
  const setStudyColor = useSetAtom(studyColorAtom);
  const setOrientation = useSetAtom(repertoireBoardOrientationAtom);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadedRepertoireIdRef = useRef<number | null>(null);
  const initialTreeRef = useRef<typeof tree | null>(null);

  useEffect(() => {
    if (!repertoire) return;
    if (loadedRepertoireIdRef.current === repertoire.id) return;

    loadedRepertoireIdRef.current = repertoire.id;
    initialTreeRef.current = repertoire.tree;

    initializeRepertoire({ tree: repertoire.tree });
    setStudyColor(repertoire.color);
    setOrientation(repertoire.color);
    setHasUnsavedChanges(false);
  }, [repertoire, initializeRepertoire, setStudyColor, setOrientation]);

  useEffect(() => {
    if (!initialTreeRef.current) return;
    if (tree === initialTreeRef.current) return;
    setHasUnsavedChanges(true);
  }, [tree]);

  const handleSave = async () => {
    if (!repertoire) return;
    setIsSaving(true);
    try {
      await updateRepertoire(repertoire.id, { tree });
      initialTreeRef.current = tree;
      setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isReady) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!repertoire) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          Repertoire not found
        </Typography>
        <Typography sx={{ color: isDark ? CC.textSub : CC.lTextSub }}>
          It may have been deleted.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pt: 2, pb: 4 }}>
      <PageTitle title={`${repertoire.name} — Chesskit`} />

      <Box sx={{ mb: 1.5 }}>
        <Button
          size="small"
          variant="text"
          onClick={() => router.push("/openings")}
          startIcon={<Icon icon="material-symbols:arrow-back" width={16} />}
          sx={{
            color: isDark ? CC.textSub : CC.lTextSub,
            "&:hover": { color: CC.primary },
          }}
        >
          All repertoires
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 2fr) minmax(280px, 1fr)",
          },
          gap: 2,
          alignItems: "start",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <RepertoireBoard repertoire={repertoire} />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <RepertoirePanel
            repertoire={repertoire}
            onSave={handleSave}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
          />
          <MoveTree />
          <NotesPanel
            repertoireId={repertoire.id}
            scope="repertoire"
          />
        </Box>
      </Box>
    </Box>
  );
}
