import { Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import type {} from "@mui/lab/themeAugmentation";
import type {} from "@mui/x-data-grid/themeAugmentation";
import { PropsWithChildren, useEffect, useMemo } from "react";
import NavBar from "./NavBar";
import SideBar, { SIDEBAR_WIDTH } from "./SideBar";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { CC, RAW_TOKENS } from "@/constants";

export default function Layout({ children }: PropsWithChildren) {
  // Zenith is light-mode-first — wellness aesthetic lives in the light.
  const [isDark, setDark] = useLocalStorage("useDarkMode", false);

  // Drive the entire color palette through a single attribute on <html>.
  // CSS variables in src/styles/design.css resolve from there, so a theme
  // change is a single DOM write — no React tree re-style needed.
  useEffect(() => {
    if (typeof document === "undefined" || isDark === null) return;
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light"
    );
  }, [isDark]);

  const theme = useMemo(() => {
    const d = !!isDark;
    // MUI palette needs literal hex values (it runs color-math on them).
    // Everything else in the theme keeps reading CSS variables via CC.*.
    const raw = d ? RAW_TOKENS.dark : RAW_TOKENS.light;

    return createTheme({
      palette: {
        mode: d ? "dark" : "light",
        primary: {
          main: raw.primary,
          contrastText: raw.primaryContrast,
        },
        secondary: {
          main: raw.gold,
          contrastText: raw.bg0,
        },
        background: {
          default: raw.bg1,
          paper: raw.bg2,
        },
        text: {
          primary: raw.text,
          secondary: raw.textSub,
          disabled: raw.textMuted,
        },
        divider: raw.border,
        error: { main: raw.error },
        warning: { main: raw.gold },
        success: { main: raw.green },
      },
      shape: { borderRadius: 12 },
      typography: {
        fontFamily: CC.fontSans,
        h1: {
          fontFamily: CC.fontSerif,
          fontSize: 56,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          lineHeight: 1.05,
        },
        h2: {
          fontFamily: CC.fontSerif,
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: "-0.025em",
          lineHeight: 1.1,
        },
        h3: {
          fontFamily: CC.fontSans,
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: 1.25,
        },
        h4: {
          fontFamily: CC.fontSans,
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: "-0.015em",
          lineHeight: 1.3,
        },
        h5: {
          fontFamily: CC.fontSans,
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          lineHeight: 1.35,
        },
        h6: {
          fontFamily: CC.fontSans,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0",
          lineHeight: 1.4,
        },
        body1: {
          fontFamily: CC.fontSans,
          fontSize: 15,
          fontWeight: 400,
          letterSpacing: "-0.01em",
          lineHeight: 1.55,
        },
        body2: {
          fontFamily: CC.fontSans,
          fontSize: 13,
          fontWeight: 400,
          letterSpacing: "-0.005em",
          lineHeight: 1.5,
        },
        caption: {
          fontFamily: CC.fontSans,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.04em",
          lineHeight: 1.2,
        },
        button: {
          fontFamily: CC.fontSans,
          fontWeight: 500,
          textTransform: "none",
          fontSize: 14,
          letterSpacing: "-0.005em",
        },
        subtitle1: { fontFamily: CC.fontSans, fontSize: 14, fontWeight: 500 },
        subtitle2: {
          fontFamily: CC.fontSans,
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.02em",
        },
        overline: {
          fontFamily: CC.fontSans,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          lineHeight: 1,
        },
      },
      transitions: {
        easing: { easeOut: "ease" },
        duration: {
          shortest: 80,
          shorter: 100,
          short: 120,
          standard: 150,
          complex: 200,
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            "*, *::before, *::after": { boxSizing: "border-box" },
            "::-webkit-scrollbar": { width: 6, height: 6 },
            "::-webkit-scrollbar-track": { background: "transparent" },
            "::-webkit-scrollbar-thumb": {
              background: CC.bg4,
              borderRadius: 3,
            },
            "::-webkit-scrollbar-thumb:hover": { background: CC.bg5 },
          },
        },

        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: "var(--cc-radius-pill)",
              fontFamily: CC.fontSans,
              fontWeight: 600,
              fontSize: 14,
              textTransform: "none",
              letterSpacing: "-0.005em",
              padding: "10px 22px",
              transition: `background-color var(--cc-motion-duration-fast) ${CC.motionEasing}, border-color var(--cc-motion-duration-fast) ${CC.motionEasing}, color var(--cc-motion-duration-fast) ${CC.motionEasing}, transform var(--cc-motion-duration-fast) ${CC.motionEasing}`,
              "&:hover": { transform: "none" },
              "&:active": { transform: "scale(0.97)" },
            },
            containedPrimary: {
              backgroundColor: CC.primary,
              color: CC.primaryContrast,
              boxShadow: "none",
              "&:hover": {
                backgroundColor: CC.primary,
                color: CC.primaryContrast,
                opacity: 0.92,
                boxShadow: "none",
              },
              "&:active": { backgroundColor: CC.primary, boxShadow: "none" },
              "&.Mui-disabled": {
                backgroundColor: CC.bg3,
                color: CC.textMuted,
                boxShadow: "none",
              },
            },
            containedSecondary: {
              backgroundColor: "var(--cc-secondary-container)",
              color: "var(--cc-on-secondary-container)",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "var(--cc-secondary-container)",
                opacity: 0.92,
                boxShadow: "none",
              },
            },
            outlined: {
              borderWidth: 1,
              borderRadius: "var(--cc-radius-pill)",
            },
            outlinedPrimary: {
              borderColor: CC.border,
              color: CC.text,
              "&:hover": {
                borderColor: CC.borderHover,
                backgroundColor: "var(--cc-primary-fixed)",
              },
            },
            text: {
              color: CC.primary,
              "&:hover": { backgroundColor: "var(--cc-primary-fixed)" },
            },
            sizeSmall: {
              padding: "6px 16px",
              borderRadius: "var(--cc-radius-pill)",
              fontSize: 12,
            },
            sizeLarge: {
              padding: "12px 28px",
              borderRadius: "var(--cc-radius-pill)",
              fontSize: 15,
            },
          },
        },
        MuiLoadingButton: {
          styleOverrides: {
            root: {
              borderRadius: "var(--cc-radius-pill)",
              fontFamily: CC.fontSans,
              fontWeight: 600,
              textTransform: "none",
              padding: "10px 22px",
              backgroundColor: CC.primary,
              color: CC.primaryContrast,
              "&:hover": {
                backgroundColor: CC.primary,
                color: CC.primaryContrast,
                opacity: 0.92,
              },
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              borderRadius: "var(--cc-radius-pill)",
              transition: `background-color var(--cc-motion-duration-fast) ${CC.motionEasing}, color var(--cc-motion-duration-fast) ${CC.motionEasing}`,
              color: CC.textSub,
              "&:hover": {
                backgroundColor: "var(--cc-primary-fixed)",
                color: CC.primary,
              },
              "&:active": { backgroundColor: "var(--cc-primary-fixed-dim)" },
            },
          },
        },

        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
              backgroundColor: "var(--cc-surface-container-lowest)",
              borderRadius: "var(--cc-radius-xl)",
              transition: `box-shadow var(--cc-motion-duration) ${CC.motionEasing}`,
            },
            elevation0: { boxShadow: "none" },
            elevation1: { boxShadow: "var(--cc-shadow-soft)" },
            elevation2: { boxShadow: "var(--cc-shadow-ambient)" },
            elevation3: { boxShadow: CC.shadowDialog },
          },
        },

        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor:
                "color-mix(in srgb, var(--cc-surface) 80%, transparent)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              color: CC.text,
              boxShadow: "none",
              borderBottom: "none",
            },
          },
        },

        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: CC.bg0,
              borderRight: `1px solid ${CC.navBorder}`,
            },
          },
        },

        MuiListItemButton: {
          styleOverrides: {
            root: {
              borderRadius: "var(--cc-radius-pill)",
              transition: `background-color var(--cc-motion-duration-fast) ${CC.motionEasing}`,
              "&:hover": { backgroundColor: "var(--cc-primary-fixed)" },
              "&.Mui-selected": {
                backgroundColor: "var(--cc-primary-fixed)",
                color: "var(--cc-on-primary-fixed)",
                "&:hover": { backgroundColor: "var(--cc-primary-fixed-dim)" },
              },
            },
          },
        },
        MuiListItemIcon: {
          styleOverrides: { root: { minWidth: 32, color: CC.textSub } },
        },

        MuiTextField: {
          styleOverrides: {
            root: {
              "& .MuiOutlinedInput-root": {
                borderRadius: "var(--cc-radius-md)",
                backgroundColor: "var(--cc-surface-container-low)",
                fontSize: 14,
                fontFamily: CC.fontSans,
                "& fieldset": {
                  borderColor: CC.border,
                  transition: `border-color var(--cc-motion-duration-fast) ${CC.motionEasing}`,
                },
                "&:hover fieldset": { borderColor: CC.borderHover },
                "&.Mui-focused fieldset": {
                  borderColor: CC.primary,
                  borderWidth: 2,
                },
              },
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: "var(--cc-radius-md)",
              backgroundColor: "var(--cc-surface-container-low)",
              fontSize: 14,
              fontFamily: CC.fontSans,
              "& fieldset": {
                borderColor: CC.border,
                transition: `border-color var(--cc-motion-duration-fast) ${CC.motionEasing}`,
              },
              "&:hover fieldset": { borderColor: CC.borderHover },
              "&.Mui-focused fieldset": {
                borderColor: CC.primary,
                borderWidth: 2,
              },
            },
          },
        },
        MuiSelect: {
          styleOverrides: {
            outlined: { borderRadius: "var(--cc-radius-md)" },
          },
        },
        MuiAutocomplete: {
          styleOverrides: {
            paper: { borderRadius: "var(--cc-radius-md)" },
            listbox: { padding: "4px 0" },
            option: {
              borderRadius: "var(--cc-radius-sm)",
              fontSize: 14,
              fontFamily: CC.fontSans,
              padding: "6px 12px",
              margin: "0 4px",
            },
          },
        },

        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: "none",
              fontFamily: CC.fontSans,
              fontWeight: 500,
              fontSize: 14,
              letterSpacing: "-0.005em",
              transition: `color var(--cc-motion-duration) ${CC.motionEasing}`,
              minHeight: 40,
              padding: "6px 16px",
              color: CC.textSub,
              "&:hover": { color: CC.text },
              "&.Mui-selected": { color: CC.text, fontWeight: 600 },
            },
          },
        },
        MuiTabs: {
          styleOverrides: {
            indicator: {
              backgroundColor: CC.primary,
              height: 3,
              borderRadius: "var(--cc-radius-pill)",
              transition: `left var(--cc-motion-duration) ${CC.motionEasing}, width var(--cc-motion-duration) ${CC.motionEasing}`,
            },
          },
        },

        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: "var(--cc-radius-pill)",
              fontFamily: CC.fontSans,
              fontWeight: 600,
              fontSize: 12,
              letterSpacing: "0.01em",
              height: 26,
              backgroundColor: "var(--cc-primary-fixed)",
              color: "var(--cc-on-primary-fixed)",
            },
          },
        },

        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: "var(--cc-radius-xl)",
              boxShadow: CC.shadowDialog,
              backgroundColor: "var(--cc-surface-container-lowest)",
              backgroundImage: "none",
              border: "none",
            },
          },
        },
        MuiDialogTitle: {
          styleOverrides: {
            root: {
              fontFamily: CC.fontSans,
              fontWeight: 600,
              fontSize: 18,
              padding: "16px 20px 12px",
              letterSpacing: "-0.015em",
            },
          },
        },
        MuiDialogContent: {
          styleOverrides: { root: { padding: "8px 20px 16px" } },
        },
        MuiDialogActions: {
          styleOverrides: { root: { padding: "8px 20px 16px", gap: 8 } },
        },

        MuiDivider: {
          styleOverrides: { root: { borderColor: CC.border } },
        },

        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              backgroundColor: "var(--cc-inverse-surface)",
              borderRadius: "var(--cc-radius-md)",
              fontFamily: CC.fontSans,
              fontSize: 12,
              fontWeight: 500,
              padding: "6px 10px",
              color: "var(--cc-inverse-on-surface)",
            },
          },
        },

        MuiLinearProgress: {
          styleOverrides: {
            root: {
              borderRadius: 0,
              backgroundColor: CC.bg3,
              height: 2,
            },
            bar: { backgroundColor: CC.primary, borderRadius: 0 },
          },
        },

        MuiAlert: {
          styleOverrides: {
            root: {
              borderRadius: "var(--cc-radius-md)",
              fontFamily: CC.fontSans,
              fontSize: 14,
            },
          },
        },
        MuiSnackbar: {
          styleOverrides: {
            root: {
              "& .MuiPaper-root": { borderRadius: "var(--cc-radius-pill)" },
            },
          },
        },

        MuiMenu: {
          styleOverrides: {
            paper: {
              borderRadius: "var(--cc-radius-lg)",
              boxShadow: CC.shadowMenu,
              backgroundColor: "var(--cc-surface-container-lowest)",
              border: "none",
              backgroundImage: "none",
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              borderRadius: "var(--cc-radius-sm)",
              margin: "0 4px",
              fontFamily: CC.fontSans,
              fontSize: 14,
              fontWeight: 500,
              padding: "8px 12px",
              minHeight: 36,
              transition: `background-color var(--cc-motion-duration-fast) ${CC.motionEasing}`,
              "&:hover": { backgroundColor: "var(--cc-primary-fixed)" },
              "&.Mui-selected": {
                backgroundColor: "var(--cc-primary-fixed)",
                color: "var(--cc-on-primary-fixed)",
                "&:hover": { backgroundColor: "var(--cc-primary-fixed-dim)" },
              },
            },
          },
        },

        MuiDataGrid: {
          styleOverrides: {
            root: {
              border: "none",
              borderRadius: "var(--cc-radius-xl)",
              backgroundColor: "var(--cc-surface-container-lowest)",
              fontSize: 14,
              fontFamily: CC.fontSans,
              boxShadow: "var(--cc-shadow-soft)",
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "var(--cc-surface-container-low)",
                borderBottom: `1px solid ${CC.border}`,
                borderRadius: 0,
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontFamily: CC.fontSans,
                fontWeight: 600,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: CC.textSub,
              },
              "& .MuiDataGrid-row": {
                borderBottom: `1px solid ${CC.border}`,
                transition: `background-color var(--cc-motion-duration-fast) ${CC.motionEasing}`,
                "&:hover": { backgroundColor: CC.bg3 },
                "&:last-child": { borderBottom: "none" },
              },
              "& .MuiDataGrid-cell": { borderBottom: "none", fontSize: 14 },
              "& .MuiDataGrid-footerContainer": { display: "none" },
              "& .MuiDataGrid-virtualScroller": { minHeight: 80 },
              "& .MuiCheckbox-root": { color: CC.textSub },
            },
          },
        },

        MuiSwitch: {
          styleOverrides: {
            switchBase: {
              "&.Mui-checked": { color: CC.primary },
              "&.Mui-checked + .MuiSwitch-track": {
                backgroundColor: CC.primary,
              },
            },
          },
        },

        MuiSlider: {
          styleOverrides: {
            root: { color: CC.primary },
            thumb: {
              "&:hover": { boxShadow: `0 0 0 8px ${CC.primaryMuted}` },
            },
            track: { backgroundColor: CC.primary },
            rail: { backgroundColor: CC.bg4 },
          },
        },

        MuiCircularProgress: {
          styleOverrides: { root: { color: CC.primary } },
        },
      },
    });
  }, [isDark]);

  if (isDark === null) return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SideBar darkMode={!!isDark} switchDarkMode={() => setDark((v) => !v)} />
      <NavBar darkMode={!!isDark} switchDarkMode={() => setDark((v) => !v)} />
      <Box
        component="main"
        sx={{
          ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
          mb: "2vh",
        }}
      >
        {children}
      </Box>
    </ThemeProvider>
  );
}
