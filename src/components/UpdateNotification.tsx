import { Icon } from "@iconify/react";
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Slide,
  SlideProps,
  Snackbar,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { CC } from "@/constants";

interface UpdatesBridge {
  onAvailable: (cb: (info: { version?: string }) => void) => () => void;
  onDownloadProgress: (cb: (info: { percent: number }) => void) => () => void;
  onDownloaded: (cb: (info: { version?: string }) => void) => () => void;
  quitAndInstall: () => void;
}

declare global {
  interface Window {
    updates?: UpdatesBridge;
  }
}

type Phase = "idle" | "available" | "downloaded";

const SlideUp = (props: SlideProps) => <Slide {...props} direction="up" />;

export default function UpdateNotification() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [phase, setPhase] = useState<Phase>("idle");
  const [version, setVersion] = useState<string | undefined>(undefined);
  const [percent, setPercent] = useState<number>(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const bridge = typeof window !== "undefined" ? window.updates : undefined;
    if (!bridge) return;

    const offAvailable = bridge.onAvailable(({ version }) => {
      setVersion(version);
      setPercent(0);
      setDismissed(false);
      setPhase("available");
    });
    const offProgress = bridge.onDownloadProgress(({ percent }) => {
      setPercent(Math.max(0, Math.min(100, percent)));
    });
    const offDownloaded = bridge.onDownloaded(({ version }) => {
      setVersion(version);
      setDismissed(false);
      setPhase("downloaded");
    });

    return () => {
      offAvailable();
      offProgress();
      offDownloaded();
    };
  }, []);

  // ── Dev-only: simulate the full update flow without a real release ──
  // Trigger with `?test-update=1` on any page. Stepped sequence so you
  // can eyeball both states (downloading w/ progress, then ready-to-install).
  // Tree-shaken out of production by the NODE_ENV check below.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (typeof window === "undefined") return;
    if (
      new URLSearchParams(window.location.search).get("test-update") !== "1"
    ) {
      return;
    }

    setVersion("9.9.9");
    setPercent(0);
    setDismissed(false);
    setPhase("available");

    const progressTimers: ReturnType<typeof setTimeout>[] = [];
    [10, 35, 60, 85, 100].forEach((p, idx) => {
      progressTimers.push(setTimeout(() => setPercent(p), (idx + 1) * 1200));
    });
    const downloadedTimer = setTimeout(() => {
      setDismissed(false);
      setPhase("downloaded");
    }, 7000);

    // Intercept the renderer→main IPC so the fake "Restart now" doesn't
    // actually trigger an autoUpdater.quitAndInstall() — just reset the
    // banner so you can re-trigger by reloading the page.
    const realBridge = window.updates;
    window.updates = {
      ...(realBridge ?? {
        onAvailable: () => () => {},
        onDownloadProgress: () => () => {},
        onDownloaded: () => () => {},
        quitAndInstall: () => {},
      }),
      quitAndInstall: () => {
        // eslint-disable-next-line no-console
        console.log("[update test] quitAndInstall fired");
        setPhase("idle");
      },
    };

    return () => {
      progressTimers.forEach(clearTimeout);
      clearTimeout(downloadedTimer);
      if (realBridge) window.updates = realBridge;
      else delete window.updates;
    };
  }, []);

  const open = phase !== "idle" && !dismissed;

  const isReady = phase === "downloaded";
  const title = isReady
    ? `Update ${version ?? ""} ready to install`
    : `Downloading update${version ? ` v${version}` : ""}…`;
  const subtitle = isReady
    ? "Restart now or it will install on next quit."
    : `${Math.round(percent)}% downloaded`;

  const handleInstall = () => {
    window.updates?.quitAndInstall();
  };

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      slots={{ transition: SlideUp }}
      onClose={() => {
        /* clicking outside should not dismiss */
      }}
    >
      <Box
        sx={{
          minWidth: 320,
          maxWidth: 380,
          backgroundColor: isDark ? CC.bg2 : CC.lBg1,
          border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
          borderRadius: "10px",
          boxShadow: "var(--cc-shadow-ambient)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "flex-start", p: 1.5, gap: 1.25 }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: CC.primaryMuted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon
              icon={
                isReady
                  ? "material-symbols:check-circle-outline"
                  : "material-symbols:download"
              }
              width={18}
              color={CC.primary}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: isDark ? CC.text : CC.lText,
                lineHeight: 1.3,
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                color: isDark ? CC.textSub : CC.lTextSub,
                lineHeight: 1.4,
                mt: 0.25,
              }}
            >
              {subtitle}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setDismissed(true)}
            sx={{ p: "2px", mt: "-2px" }}
            aria-label="Dismiss"
          >
            <Icon icon="material-symbols:close" width={14} />
          </IconButton>
        </Box>

        {!isReady && (
          <LinearProgress
            variant={percent > 0 ? "determinate" : "indeterminate"}
            value={percent}
            sx={{ height: 3 }}
          />
        )}

        {isReady && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 0.5,
              px: 1,
              pb: 1,
            }}
          >
            <Button
              size="small"
              variant="text"
              onClick={() => setDismissed(true)}
              sx={{ fontSize: 12 }}
            >
              Later
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleInstall}
              startIcon={<Icon icon="material-symbols:refresh" width={14} />}
              sx={{ fontSize: 12 }}
            >
              Restart now
            </Button>
          </Box>
        )}
      </Box>
    </Snackbar>
  );
}
