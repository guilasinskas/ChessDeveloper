import { Box, Button, Typography, useTheme, CircularProgress } from "@mui/material";
import { Icon } from "@iconify/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CC, DEFAULT_ENGINE } from "@/constants";
import { PageTitle } from "@/components/pageTitle";
import { useRepertoireDatabase } from "@/hooks/useRepertoireDatabase";
import { useAtomValue, useSetAtom } from "jotai";
import {
  hasUnsavedChangesAtom,
  repertoireBoardOrientationAtom,
  repertoireEngineReadyAtom,
  repertoireTreeAtom,
  studyColorAtom,
} from "@/sections/openings/states";
import {
  initializeRepertoireAction,
  markRepertoireSavedAction,
} from "@/sections/openings/actions";
import RepertoireBoard from "@/sections/openings/RepertoireBoard";
import MoveTree from "@/sections/openings/MoveTree";
import RepertoirePanel from "@/sections/openings/RepertoirePanel";
import NotesPanel from "@/sections/notes/NotesPanel";
import { useEngine } from "@/hooks/useEngine";

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
  const hasUnsavedChanges = useAtomValue(hasUnsavedChangesAtom);
  const initializeRepertoire = useSetAtom(initializeRepertoireAction);
  const markSaved = useSetAtom(markRepertoireSavedAction);
  const setStudyColor = useSetAtom(studyColorAtom);
  const setOrientation = useSetAtom(repertoireBoardOrientationAtom);

  const engine = useEngine(DEFAULT_ENGINE);
  const setEngineReady = useSetAtom(repertoireEngineReadyAtom);

  useEffect(() => {
    setEngineReady(engine !== null && engine.getIsReady());
  }, [engine, setEngineReady]);

  const [isSaving, setIsSaving] = useState(false);

  const loadedRepertoireIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!repertoire) return;
    if (loadedRepertoireIdRef.current === repertoire.id) return;

    loadedRepertoireIdRef.current = repertoire.id;
    initializeRepertoire({ tree: repertoire.tree });
    setStudyColor(repertoire.color);
    setOrientation(repertoire.color);
  }, [repertoire, initializeRepertoire, setStudyColor, setOrientation]);

  const handleSave = async () => {
    if (!repertoire) return;
    setIsSaving(true);
    try {
      await updateRepertoire(repertoire.id, { tree });
      markSaved();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isReady || !router.isReady) {
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
    <Box>
      <PageTitle title={`${repertoire.name} — Chesskit`} />

      {/* Sticky title bar — Stitch "Repertoire Editor" with repertoire name + back */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
          px: { xs: 2, md: 3 },
          backgroundColor:
            "color-mix(in srgb, var(--cc-surface) 80%, transparent)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${CC.border}`,
          position: "sticky",
          top: 0,
          zIndex: 10,
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <Button
            size="small"
            variant="text"
            onClick={() => router.push("/openings")}
            sx={{
              minWidth: 0,
              p: "6px",
              borderRadius: "var(--cc-radius-pill)",
              color: CC.textSub,
              "&:hover": { color: CC.primary, backgroundColor: "var(--cc-primary-fixed)" },
            }}
          >
            <Icon icon="material-symbols:arrow-back" width={20} />
          </Button>
          <Typography
            sx={{
              fontFamily: "var(--cc-font-headline)",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: CC.primary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {repertoire.name}
          </Typography>
          <Box
            sx={{
              px: 1.5,
              py: 0.25,
              borderRadius: "var(--cc-radius-pill)",
              backgroundColor:
                repertoire.color === "w"
                  ? "var(--cc-primary-fixed)"
                  : "var(--cc-inverse-surface)",
              color:
                repertoire.color === "w"
                  ? "var(--cc-on-primary-fixed)"
                  : "var(--cc-inverse-on-surface)",
              fontFamily: "var(--cc-font-body)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            {repertoire.color === "w" ? "WHITE LINES" : "BLACK LINES"}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          px: { xs: 1, sm: 2, md: 3 },
          pt: 3,
          pb: 4,
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
          <RepertoireBoard repertoire={repertoire} engine={engine} />
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
