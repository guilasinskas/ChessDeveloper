import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { useEffect, useState } from "react";
import NavMenu from "./NavMenu";
import { Icon } from "@iconify/react";
import { useRouter } from "next/router";
import Image from "next/image";
import { CC } from "@/constants";
import { useTheme } from "@mui/material";
import NavLink from "@/components/NavLink";

const NAV_LINKS = [
  { text: "Play", icon: "streamline:chess-pawn", href: "/play" },
  { text: "Analysis", icon: "streamline:magnifying-glass-solid", href: "/" },
  { text: "Database", icon: "streamline:database", href: "/database" },
];

interface Props {
  darkMode: boolean;
  switchDarkMode: () => void;
}

export default function NavBar({ darkMode: d, switchDarkMode }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => { setDrawerOpen(false); }, [router.pathname]);

  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" enableColorOnDark elevation={0}>
        <Toolbar
          sx={{
            minHeight: "64px !important",
            height: 64,
            px: { xs: 1.5, sm: 3 },
            gap: 0,
          }}
        >
          {/* Hamburger — mobile only */}
          <IconButton
            size="small"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen((v) => !v)}
            sx={{
              display: { md: "none" },
              mr: 1,
              borderRadius: 1,
              color: isDark ? CC.textSub : CC.lTextSub,
              "&:hover": { backgroundColor: isDark ? CC.bg3 : CC.lBg3, color: isDark ? CC.text : CC.lText },
            }}
          >
            <Icon icon="mdi:menu" width={22} />
          </IconButton>

          {/* Logo */}
          <NavLink href="/">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                mr: { xs: 0, md: 4 },
                py: 1,
                px: "8px",
                borderRadius: "4px",
                "&:hover": { backgroundColor: isDark ? CC.bg3 : CC.lBg3 },
              }}
            >
              <Image
                src="/favicon-32x32.png"
                alt="Chesskit"
                width={28}
                height={28}
              />
              <Typography
                sx={{
                  display: { xs: "none", sm: "block" },
                  fontFamily: `var(--font-space-grotesk), "Space Grotesk", sans-serif`,
                  fontWeight: 700,
                  fontSize: 18,
                  letterSpacing: "-0.04em",
                  color: isDark ? CC.text : CC.lText,
                }}
              >
                chesskit
              </Typography>
            </Box>
          </NavLink>

          {/* Nav links — desktop */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              height: "100%",
              gap: 0,
            }}
          >
            {NAV_LINKS.map(({ text, icon, href }) => {
              const isActive =
                href === "/" ? router.pathname === "/" : router.pathname.startsWith(href);
              return (
                <NavLink key={href} href={href}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      px: "16px",
                      height: 64,
                      cursor: "pointer",
                      position: "relative",
                      color: isActive
                        ? CC.primary
                        : isDark ? CC.textSub : CC.lTextSub,
                      fontFamily: `var(--font-space-grotesk), "Space Grotesk", sans-serif`,
                      fontWeight: isActive ? 600 : 400,
                      fontSize: 14,
                      letterSpacing: "-0.01em",
                      transition: "color 120ms ease, background-color 120ms ease",
                      "&:hover": {
                        backgroundColor: isDark ? CC.bg3 : CC.lBg3,
                        color: isDark ? CC.text : CC.lText,
                      },
                      "&::after": isActive ? {
                        content: '""',
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        backgroundColor: CC.primary,
                      } : {},
                    }}
                  >
                    <Icon
                      icon={icon}
                      width={16}
                      color={isActive ? CC.primary : undefined}
                    />
                    <Typography
                      sx={{
                        fontFamily: "inherit",
                        fontSize: "inherit",
                        fontWeight: "inherit",
                        color: "inherit",
                        letterSpacing: "inherit",
                        lineHeight: 1,
                      }}
                    >
                      {text}
                    </Typography>
                  </Box>
                </NavLink>
              );
            })}
          </Box>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Right controls */}
          <Box sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <IconButton
              size="small"
              component="a"
              href="https://discord.gg/GnJ73BQQXH"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
              sx={{
                borderRadius: 1,
                color: isDark ? CC.textSub : CC.lTextSub,
                "&:hover": { backgroundColor: isDark ? CC.bg3 : CC.lBg3, color: isDark ? CC.text : CC.lText },
              }}
            >
              <Icon icon="ic:baseline-discord" width={20} />
            </IconButton>

            <IconButton
              size="small"
              component="a"
              href="https://github.com/brianwc/chesskit"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              sx={{
                borderRadius: 1,
                color: isDark ? CC.textSub : CC.lTextSub,
                "&:hover": { backgroundColor: isDark ? CC.bg3 : CC.lBg3, color: isDark ? CC.text : CC.lText },
              }}
            >
              <Icon icon="mdi:github" width={20} />
            </IconButton>

            <IconButton
              size="small"
              onClick={switchDarkMode}
              aria-label="Toggle dark mode"
              sx={{
                borderRadius: 1,
                color: isDark ? CC.textSub : CC.lTextSub,
                "&:hover": { backgroundColor: isDark ? CC.bg3 : CC.lBg3, color: isDark ? CC.text : CC.lText },
              }}
            >
              <Icon icon={d ? "mdi:weather-sunny" : "mdi:weather-night"} width={20} />
            </IconButton>
          </Box>

          <NavMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </Toolbar>
      </AppBar>
    </Box>
  );
}
