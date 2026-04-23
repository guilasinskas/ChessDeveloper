import {
  Box,
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import type {} from "@mui/lab/themeAugmentation";
import type {} from "@mui/x-data-grid/themeAugmentation";
import { PropsWithChildren, useMemo } from "react";
import NavBar from "./NavBar";
import SideBar, { SIDEBAR_WIDTH } from "./SideBar";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { CC } from "@/constants";

interface LayoutProps extends PropsWithChildren {
  fontVariable?: string;
}

export default function Layout({ children, fontVariable }: LayoutProps) {
  const [isDark, setDark] = useLocalStorage("useDarkMode", true);

  const theme = useMemo(() => {
    const d = !!isDark;

    const sgFont = `var(--font-space-grotesk), "Space Grotesk", -apple-system, "Helvetica Neue", Arial, sans-serif`;
    const maFont = `var(--font-montserrat-alt), "Montserrat Alternates", -apple-system, "Helvetica Neue", Arial, sans-serif`;

    return createTheme({
      palette: {
        mode: d ? "dark" : "light",
        primary: {
          main: CC.primary,
          light: "#c8dbff",
          dark: CC.primaryDark,
          contrastText: "#002f67",
        },
        secondary: {
          main: CC.gold,
          contrastText: d ? CC.bg1 : "#261900",
        },
        background: {
          default: d ? CC.bg1 : CC.lBg0,
          paper: d ? CC.bg2 : CC.lBg1,
        },
        text: {
          primary: d ? CC.text : CC.lText,
          secondary: d ? CC.textSub : CC.lTextSub,
          disabled: d ? CC.textMuted : "#8b91a0",
        },
        divider: d ? CC.border : CC.lBorder,
        error: { main: d ? "#ffb4ab" : "#c62828" },
        warning: { main: CC.gold },
        success: { main: CC.green },
      },
      shape: { borderRadius: 2 },
      typography: {
        fontFamily: sgFont,
        h1: { fontFamily: sgFont, fontSize: 48, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.1 },
        h2: { fontFamily: sgFont, fontSize: 32, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.2 },
        h3: { fontFamily: sgFont, fontSize: 24, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.2 },
        h4: { fontFamily: sgFont, fontSize: 18, fontWeight: 600, lineHeight: 1.4 },
        h5: { fontFamily: sgFont, fontSize: 16, fontWeight: 600, lineHeight: 1.3 },
        h6: { fontFamily: sgFont, fontSize: 14, fontWeight: 600, lineHeight: 1.4 },
        body1: { fontFamily: maFont, fontSize: 16, fontWeight: 400, letterSpacing: "-0.05em", lineHeight: 1.5 },
        body2: { fontFamily: maFont, fontSize: 14, fontWeight: 400, letterSpacing: "-0.05em", lineHeight: 1.5 },
        caption: { fontFamily: sgFont, fontSize: 12, fontWeight: 500, letterSpacing: "0.02em", lineHeight: 1 },
        button: { fontFamily: sgFont, fontWeight: 600, textTransform: "none", fontSize: 14, letterSpacing: "-0.01em" },
        subtitle1: { fontFamily: sgFont, fontSize: 14, fontWeight: 500 },
        subtitle2: { fontFamily: sgFont, fontSize: 12, fontWeight: 500, letterSpacing: "0.02em" },
        overline: { fontFamily: sgFont, fontSize: 14, fontWeight: 700, letterSpacing: "0.05em", lineHeight: 1 },
      },
      transitions: {
        easing: { easeOut: "ease" },
        duration: { shortest: 80, shorter: 100, short: 120, standard: 150, complex: 200 },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            "*, *::before, *::after": { boxSizing: "border-box" },
            body: {
              backgroundColor: d ? CC.bg1 : CC.lBg0,
              scrollbarWidth: "thin",
              scrollbarColor: d ? `${CC.bg4} ${CC.bg2}` : "#c4c8d8 #f0f2f8",
            },
            "::-webkit-scrollbar": { width: 6, height: 6 },
            "::-webkit-scrollbar-track": { background: d ? CC.bg2 : "#f0f2f8" },
            "::-webkit-scrollbar-thumb": {
              background: d ? CC.bg4 : "#c4c8d8",
              borderRadius: 3,
            },
          },
        },

        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 4,
              fontFamily: sgFont,
              fontWeight: 600,
              fontSize: 14,
              textTransform: "none",
              letterSpacing: "-0.01em",
              transition: "background-color 120ms ease, box-shadow 120ms ease",
              "&:hover": { transform: "none" },
              "&:active": { transform: "none" },
            },
            containedPrimary: {
              backgroundColor: CC.primaryDark,
              color: "#ffffff",
              boxShadow: "none",
              "&:hover": { backgroundColor: CC.primary, color: "#002f67", boxShadow: "none" },
              "&:active": { backgroundColor: CC.primaryDark, boxShadow: "none" },
              "&.Mui-disabled": {
                backgroundColor: d ? CC.bg4 : "#d8dce8",
                color: d ? CC.textMuted : "#8b91a0",
                boxShadow: "none",
              },
            },
            containedSecondary: {
              backgroundColor: d ? CC.bg3 : CC.lBg3,
              color: d ? CC.text : CC.lText,
              boxShadow: "none",
              "&:hover": { backgroundColor: d ? CC.bg4 : "#dce0f0", boxShadow: "none" },
            },
            outlined: { borderWidth: 1, borderRadius: 4 },
            outlinedPrimary: {
              borderColor: CC.primary,
              color: CC.primary,
              "&:hover": {
                borderColor: CC.primaryDark,
                backgroundColor: d ? CC.primaryMuted : "rgba(172,199,255,0.08)",
              },
            },
            sizeSmall: { padding: "4px 12px", borderRadius: 4, fontSize: 12 },
            sizeLarge: { padding: "10px 24px", borderRadius: 4, fontSize: 15 },
          },
        },
        MuiLoadingButton: {
          styleOverrides: {
            root: {
              borderRadius: 4,
              fontFamily: sgFont,
              fontWeight: 600,
              textTransform: "none",
              backgroundColor: CC.primaryDark,
              color: "#ffffff",
              "&:hover": { backgroundColor: CC.primary, color: "#002f67" },
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              borderRadius: 4,
              transition: "background-color 100ms ease",
              "&:hover": { backgroundColor: d ? CC.bg3 : CC.lBg3 },
              "&:active": { backgroundColor: d ? CC.bg4 : CC.lBg3 },
            },
          },
        },

        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
              backgroundColor: d ? CC.bg2 : CC.lBg1,
              transition: "box-shadow 150ms ease",
            },
            elevation0: { boxShadow: "none" },
            elevation1: {
              boxShadow: d ? "0 1px 4px rgba(0,0,0,0.6)" : "0 1px 4px rgba(0,0,0,0.1)",
            },
            elevation2: {
              boxShadow: d ? "0 2px 10px rgba(0,0,0,0.6)" : "0 2px 8px rgba(0,0,0,0.1)",
            },
            elevation3: {
              boxShadow: d ? "0 4px 20px rgba(0,0,0,0.7)" : "0 4px 16px rgba(0,0,0,0.12)",
            },
          },
        },

        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: d ? CC.navBg : CC.lBg1,
              color: d ? CC.text : CC.lText,
              boxShadow: "none",
              borderBottom: `1px solid ${d ? CC.navBorder : CC.lBorder}`,
            },
          },
        },

        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: d ? CC.bg0 : CC.lBg1,
              borderRight: `1px solid ${d ? CC.border : CC.lBorder}`,
            },
          },
        },

        MuiListItemButton: {
          styleOverrides: {
            root: {
              borderRadius: 2,
              transition: "background-color 100ms ease",
              "&:hover": { backgroundColor: d ? CC.bg3 : CC.lBg3 },
              "&.Mui-selected": {
                backgroundColor: d ? CC.primaryMuted : "rgba(172,199,255,0.12)",
                borderLeft: `2px solid ${CC.primary}`,
                "&:hover": { backgroundColor: d ? CC.primarySubtle : "rgba(172,199,255,0.08)" },
              },
            },
          },
        },
        MuiListItemIcon: {
          styleOverrides: {
            root: { minWidth: 32, color: d ? CC.textSub : CC.lTextSub },
          },
        },

        MuiTextField: {
          styleOverrides: {
            root: {
              "& .MuiOutlinedInput-root": {
                borderRadius: 4,
                backgroundColor: d ? CC.bg3 : "#f0f2f8",
                fontSize: 14,
                fontFamily: maFont,
                "& fieldset": {
                  borderColor: d ? CC.border : CC.lBorder,
                  transition: "border-color 120ms ease",
                },
                "&:hover fieldset": { borderColor: d ? CC.bg5 : "#8b91a0" },
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
              borderRadius: 4,
              backgroundColor: d ? CC.bg3 : "#f0f2f8",
              fontSize: 14,
              fontFamily: maFont,
              "& fieldset": {
                borderColor: d ? CC.border : CC.lBorder,
                transition: "border-color 120ms ease",
              },
              "&:hover fieldset": { borderColor: d ? CC.bg5 : "#8b91a0" },
              "&.Mui-focused fieldset": {
                borderColor: CC.primary,
                borderWidth: 2,
              },
            },
          },
        },
        MuiSelect: {
          styleOverrides: { outlined: { borderRadius: 4 } },
        },
        MuiAutocomplete: {
          styleOverrides: {
            paper: { borderRadius: 4 },
            listbox: { padding: "4px 0" },
            option: {
              borderRadius: 0,
              fontSize: 14,
              fontFamily: maFont,
              padding: "6px 12px",
            },
          },
        },

        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: "none",
              fontFamily: sgFont,
              fontWeight: 500,
              fontSize: 14,
              letterSpacing: "-0.01em",
              transition: "color 100ms ease",
              minHeight: 40,
              padding: "6px 16px",
              "&:hover": { color: d ? CC.text : CC.lText },
              "&.Mui-selected": { color: CC.primary, fontWeight: 600 },
            },
          },
        },
        MuiTabs: {
          styleOverrides: {
            indicator: {
              backgroundColor: CC.primary,
              height: 2,
            },
          },
        },

        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 4,
              fontFamily: sgFont,
              fontWeight: 500,
              fontSize: 12,
              letterSpacing: "0.02em",
              height: 22,
            },
          },
        },

        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: 8,
              boxShadow: "0 8px 40px rgba(0,0,0,0.8)",
              backgroundColor: d ? CC.bg2 : CC.lBg1,
              backgroundImage: "none",
              border: `1px solid ${d ? CC.border : CC.lBorder}`,
            },
          },
        },
        MuiDialogTitle: {
          styleOverrides: {
            root: { fontFamily: sgFont, fontWeight: 600, fontSize: 18, padding: "16px 20px 12px" },
          },
        },
        MuiDialogContent: {
          styleOverrides: {
            root: { padding: "8px 20px 16px" },
          },
        },
        MuiDialogActions: {
          styleOverrides: {
            root: { padding: "8px 20px 16px", gap: 8 },
          },
        },

        MuiDivider: {
          styleOverrides: {
            root: { borderColor: d ? CC.border : CC.lBorder },
          },
        },

        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              backgroundColor: CC.bg0,
              border: `1px solid ${CC.border}`,
              borderRadius: 4,
              fontFamily: sgFont,
              fontSize: 12,
              fontWeight: 500,
              padding: "4px 8px",
              color: CC.text,
            },
          },
        },

        MuiLinearProgress: {
          styleOverrides: {
            root: {
              borderRadius: 2,
              backgroundColor: d ? CC.bg4 : "#d8dce8",
              height: 4,
            },
            bar: { backgroundColor: CC.primary, borderRadius: 2 },
          },
        },

        MuiAlert: {
          styleOverrides: {
            root: { borderRadius: 4, fontFamily: maFont, fontSize: 14 },
          },
        },
        MuiSnackbar: {
          styleOverrides: {
            root: { "& .MuiPaper-root": { borderRadius: 4 } },
          },
        },

        MuiMenu: {
          styleOverrides: {
            paper: {
              borderRadius: 6,
              boxShadow: d ? "0 4px 20px rgba(0,0,0,0.7)" : "0 4px 16px rgba(0,0,0,0.14)",
              backgroundColor: d ? CC.bg2 : CC.lBg1,
              border: `1px solid ${d ? CC.border : CC.lBorder}`,
              backgroundImage: "none",
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              borderRadius: 0,
              fontFamily: maFont,
              fontSize: 14,
              fontWeight: 400,
              padding: "6px 12px",
              minHeight: 36,
              transition: "background-color 80ms ease",
              "&:hover": { backgroundColor: d ? CC.bg3 : CC.lBg3 },
              "&.Mui-selected": {
                backgroundColor: d ? CC.primaryMuted : "rgba(172,199,255,0.12)",
                "&:hover": { backgroundColor: d ? CC.bg3 : CC.lBg3 },
              },
            },
          },
        },

        MuiDataGrid: {
          styleOverrides: {
            root: {
              border: `1px solid ${d ? CC.border : CC.lBorder}`,
              borderRadius: 6,
              backgroundColor: d ? CC.bg2 : CC.lBg1,
              fontSize: 14,
              fontFamily: maFont,
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: d ? CC.bg0 : CC.lBg2,
                borderBottom: `1px solid ${d ? CC.border : CC.lBorder}`,
                borderRadius: 0,
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontFamily: sgFont,
                fontWeight: 600,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: d ? CC.textSub : CC.lTextSub,
              },
              "& .MuiDataGrid-row": {
                borderBottom: `1px solid ${d ? CC.border : CC.lBorder}`,
                transition: "background-color 80ms ease",
                "&:hover": { backgroundColor: d ? CC.bg3 : CC.lBg3 },
                "&:last-child": { borderBottom: "none" },
              },
              "& .MuiDataGrid-cell": { borderBottom: "none", fontSize: 14 },
              "& .MuiDataGrid-footerContainer": { display: "none" },
              "& .MuiDataGrid-virtualScroller": { minHeight: 80 },
              "& .MuiCheckbox-root": { color: d ? CC.textSub : CC.lTextSub },
            },
          },
        },

        MuiSwitch: {
          styleOverrides: {
            switchBase: {
              "&.Mui-checked": { color: CC.primary },
              "&.Mui-checked + .MuiSwitch-track": { backgroundColor: CC.primary },
            },
          },
        },

        MuiSlider: {
          styleOverrides: {
            root: { color: CC.primary },
            thumb: { "&:hover": { boxShadow: `0 0 0 8px ${CC.primaryMuted}` } },
            track: { backgroundColor: CC.primary },
            rail: { backgroundColor: d ? CC.bg4 : "#d8dce8" },
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
      <GlobalStyles
        styles={{
          "a": { textDecoration: "none" },
          "#moves-panel": {
            scrollbarWidth: "thin",
            scrollbarColor: `${CC.bg4} transparent`,
          },
        }}
      />
      <div
        className={fontVariable}
        style={{ display: "contents" }}
      >
        <SideBar
          darkMode={!!isDark}
          switchDarkMode={() => setDark((v) => !v)}
        />
        <NavBar
          darkMode={!!isDark}
          switchDarkMode={() => setDark((v) => !v)}
        />
        <Box
          component="main"
          sx={{
            ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
            mb: "2vh",
          }}
        >
          {children}
        </Box>
      </div>
    </ThemeProvider>
  );
}
