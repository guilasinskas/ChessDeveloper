import { Icon } from "@iconify/react";
import { Box, IconButton, Tooltip, Typography, useTheme } from "@mui/material";
import { useRouter } from "next/router";
import { CC } from "@/constants";
import NavLink from "@/components/NavLink";
import Image from "next/image";

export const SIDEBAR_WIDTH = 64;

const NAV_LINKS = [
  { text: "Play", icon: "streamline:chess-pawn", href: "/play" },
  { text: "Analysis", icon: "streamline:magnifying-glass-solid", href: "/" },
  { text: "Database", icon: "streamline:database", href: "/database" },
  { text: "Openings", icon: "streamline:book-reading", href: "/openings" },
  { text: "Stats", icon: "mdi:chart-bar", href: "/stats" },
  {
    text: "Notes",
    icon: "material-symbols:sticky-note-2-outline",
    href: "/notes",
  },
];

interface Props {
  darkMode: boolean;
  switchDarkMode: () => void;
}

export default function SideBar({ darkMode, switchDarkMode }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      component="aside"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        backgroundColor: isDark ? CC.navBg : CC.lBg1,
        borderRight: `1px solid ${isDark ? CC.navBorder : CC.lBorder}`,
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        alignItems: "center",
        py: 1.5,
        zIndex: (t) => t.zIndex.drawer,
      }}
    >
      <NavLink href="/">
        <Tooltip title="Chesskit" placement="right">
          <Box
            sx={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              cursor: "pointer",
              mb: 1.5,
              "&:hover": { backgroundColor: isDark ? CC.bg3 : CC.lBg3 },
            }}
          >
            <Image
              src="/favicon-32x32.png"
              alt="Chesskit"
              width={28}
              height={28}
            />
          </Box>
        </Tooltip>
      </NavLink>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          flexGrow: 1,
          width: "100%",
          px: 1,
        }}
      >
        {NAV_LINKS.map(({ text, icon, href }) => {
          const isActive =
            href === "/"
              ? router.pathname === "/"
              : router.pathname.startsWith(href);
          return (
            <NavLink key={href} href={href}>
              <Tooltip title={text} placement="right">
                <Box
                  sx={{
                    width: "100%",
                    minHeight: 48,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    borderRadius: "4px",
                    gap: "2px",
                    py: "6px",
                    color: isActive
                      ? CC.primary
                      : isDark
                        ? CC.textSub
                        : CC.lTextSub,
                    backgroundColor: isActive
                      ? isDark
                        ? CC.primaryMuted
                        : "rgba(172,199,255,0.12)"
                      : "transparent",
                    transition: "background-color 100ms ease, color 100ms ease",
                    "&:hover": {
                      backgroundColor: isDark ? CC.bg3 : CC.lBg3,
                      color: isDark ? CC.text : CC.lText,
                    },
                  }}
                >
                  <Icon icon={icon} width={18} />
                  <Typography
                    sx={{
                      fontFamily: `var(--font-space-grotesk), "Space Grotesk", sans-serif`,
                      fontSize: 10,
                      fontWeight: isActive ? 600 : 500,
                      letterSpacing: "-0.01em",
                      lineHeight: 1,
                      color: "inherit",
                    }}
                  >
                    {text}
                  </Typography>
                </Box>
              </Tooltip>
            </NavLink>
          );
        })}
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          alignItems: "center",
          mt: 1,
        }}
      >
        <Tooltip
          title={darkMode ? "Light mode" : "Dark mode"}
          placement="right"
        >
          <IconButton
            size="small"
            onClick={switchDarkMode}
            aria-label="Toggle dark mode"
            sx={{
              borderRadius: 1,
              color: isDark ? CC.textSub : CC.lTextSub,
              "&:hover": {
                backgroundColor: isDark ? CC.bg3 : CC.lBg3,
                color: isDark ? CC.text : CC.lText,
              },
            }}
          >
            <Icon
              icon={darkMode ? "mdi:weather-sunny" : "mdi:weather-night"}
              width={18}
            />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
