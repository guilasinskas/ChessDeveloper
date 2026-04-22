import NavLink from "@/components/NavLink";
import { Icon } from "@iconify/react";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/router";
import { CC } from "@/constants";

const MenuOptions = [
  { text: "Play", icon: "streamline:chess-pawn", href: "/play" },
  { text: "Analysis", icon: "streamline:magnifying-glass-solid", href: "/" },
  { text: "Database", icon: "streamline:database", href: "/database" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NavMenu({ open, onClose }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 240, pt: 1 }}>
        <Box sx={{ px: 2, py: 1, mb: "4px" }}>
          <Typography
            sx={{
              fontFamily: `var(--font-space-grotesk), "Space Grotesk", sans-serif`,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: isDark ? CC.textMuted : "#8b91a0",
            }}
          >
            Navigation
          </Typography>
        </Box>

        <List sx={{ px: 1, gap: "2px", display: "flex", flexDirection: "column" }}>
          {MenuOptions.map(({ text, icon, href }) => {
            const isActive =
              href === "/" ? router.pathname === "/" : router.pathname.startsWith(href);
            return (
              <NavLink key={href} href={href}>
                <ListItemButton
                  onClick={onClose}
                  selected={isActive}
                  sx={{
                    py: "10px",
                    px: "10px",
                    borderRadius: "4px",
                    mb: "2px",
                    borderLeft: isActive ? `2px solid ${CC.primary}` : "2px solid transparent",
                    backgroundColor: isActive
                      ? isDark ? CC.primaryMuted : "rgba(172,199,255,0.12)"
                      : "transparent",
                    "&:hover": {
                      backgroundColor: isDark ? CC.bg3 : CC.lBg3,
                    },
                    "&.Mui-selected": {
                      backgroundColor: isDark ? CC.primaryMuted : "rgba(172,199,255,0.12)",
                      "&:hover": {
                        backgroundColor: isDark ? CC.bg3 : CC.lBg3,
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <Icon
                      icon={icon}
                      width={17}
                      color={isActive ? CC.primary : isDark ? CC.textSub : CC.lTextSub}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={text}
                    primaryTypographyProps={{
                      fontFamily: `var(--font-space-grotesk), "Space Grotesk", sans-serif`,
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 400,
                      letterSpacing: "-0.01em",
                      color: isActive
                        ? CC.primary
                        : isDark ? CC.textSub : CC.lTextSub,
                    }}
                  />
                </ListItemButton>
              </NavLink>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
}
