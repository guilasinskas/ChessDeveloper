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

interface Props {
  darkMode: boolean;
  switchDarkMode: () => void;
}

export default function NavBar({ darkMode: d, switchDarkMode }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    setDrawerOpen(false);
  }, [router.pathname]);

  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{ flexGrow: 1, display: { xs: "block", md: "none" } }}>
      <AppBar position="static" enableColorOnDark elevation={0}>
        <Toolbar
          sx={{
            minHeight: "56px !important",
            height: 56,
            px: { xs: 1.5, sm: 3 },
            gap: 0,
          }}
        >
          <IconButton
            size="small"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen((v) => !v)}
            sx={{
              mr: 1,
              borderRadius: 1,
              color: isDark ? CC.textSub : CC.lTextSub,
              "&:hover": {
                backgroundColor: isDark ? CC.bg3 : CC.lBg3,
                color: isDark ? CC.text : CC.lText,
              },
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
                alt="White to Move"
                width={28}
                height={28}
              />
              <Typography
                sx={{
                  display: { xs: "none", sm: "block" },
                  fontFamily: "var(--cc-font-headline)",
                  fontWeight: 800,
                  fontSize: 22,
                  letterSpacing: "-0.03em",
                  color: CC.primary,
                }}
              >
                white to move
              </Typography>
            </Box>
          </NavLink>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Right controls */}
          <Box sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
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
                icon={d ? "mdi:weather-sunny" : "mdi:weather-night"}
                width={20}
              />
            </IconButton>
          </Box>

          <NavMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </Toolbar>
      </AppBar>
    </Box>
  );
}
