import { Box, Typography } from "@mui/material";

/*
 * Photo cover card — Stitch "Explorador de Aberturas" pattern.
 *
 *   ┌──────────────────────┐
 *   │  [chess photo bg]    │
 *   │  ……………………………………… │
 *   │  LABEL               │  ← uppercase tracked white/70
 *   │  Big Title           │  ← Manrope white headline
 *   └──────────────────────┘
 *
 * Gradient overlay (sage by default, peach for accent variant) anchors the
 * legibility of the text without flattening the photo. The image zooms in
 * 1.1× on hover for a tactile feel.
 */

// Tiny photo pool shipped at /public/folder-covers/. Folders are mapped to
// covers by a deterministic hash of their name, so the same folder always
// shows the same image across reloads. Add more covers here as needed.
const COVERS = ["/folder-covers/knight.jpg", "/folder-covers/board.jpg"];

const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

export const coverForName = (name: string): string =>
  COVERS[hashString(name) % COVERS.length];

export interface FolderCoverCardProps {
  /** Visible large headline (e.g., the folder name). */
  title: string;
  /** Small uppercase tracked label above the title (e.g., "FOLDER"). */
  label?: string;
  /** Path to the cover image. Defaults to a hash-picked cover from the pool. */
  cover?: string;
  /** Overlay gradient — sage for the primary, peach for the accent variant. */
  variant?: "sage" | "peach";
  /** Show a sage outline indicating selected state. */
  selected?: boolean;
  /** Click handler — typically navigates / selects the folder. */
  onClick?: () => void;
  /** Optional metadata shown bottom-right (e.g., "42 games"). */
  meta?: string;
  /** Aspect ratio of the card. Defaults to 4 / 5 (portrait-ish). */
  aspectRatio?: string;
}

export default function FolderCoverCard({
  title,
  label,
  cover,
  variant = "sage",
  selected = false,
  onClick,
  meta,
  aspectRatio = "4 / 5",
}: FolderCoverCardProps) {
  const src = cover ?? coverForName(title);
  const gradient =
    variant === "peach"
      ? "linear-gradient(to top, rgba(117, 87, 84, 0.85) 0%, rgba(117, 87, 84, 0.1) 60%, transparent 100%)"
      : "linear-gradient(to top, rgba(85, 98, 77, 0.85) 0%, rgba(85, 98, 77, 0.1) 60%, transparent 100%)";

  return (
    <Box
      onClick={onClick}
      sx={{
        position: "relative",
        aspectRatio,
        borderRadius: "var(--cc-radius-xl)",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        boxShadow: "var(--cc-shadow-ambient)",
        outline: selected
          ? "3px solid var(--cc-primary)"
          : "3px solid transparent",
        outlineOffset: "-3px",
        transition:
          "outline-color var(--cc-motion-duration-fast) var(--cc-motion-easing), transform var(--cc-motion-duration-fast) var(--cc-motion-easing)",
        "&:hover": onClick ? { transform: "translateY(-2px)" } : undefined,
        "&:hover img": onClick ? { transform: "scale(1.08)" } : undefined,
        "&:active": onClick ? { transform: "translateY(0)" } : undefined,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={title}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          transition: "transform 700ms var(--cc-motion-easing)",
        }}
      />

      {/* Gradient overlay for legibility */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: gradient,
          pointerEvents: "none",
        }}
      />

      {/* Text content */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: 0.5,
        }}
      >
        {label && (
          <Typography
            sx={{
              fontFamily: "var(--cc-font-body)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255, 255, 255, 0.75)",
              lineHeight: 1,
            }}
          >
            {label}
          </Typography>
        )}
        <Typography
          sx={{
            fontFamily: "var(--cc-font-headline)",
            fontSize: { xs: 18, sm: 22 },
            fontWeight: 800,
            letterSpacing: "-0.01em",
            color: "#ffffff",
            lineHeight: 1.15,
            textShadow: "0 1px 12px rgba(0, 0, 0, 0.25)",
            wordBreak: "break-word",
          }}
        >
          {title}
        </Typography>
        {meta && (
          <Typography
            sx={{
              fontFamily: "var(--cc-font-mono)",
              fontSize: 11,
              fontWeight: 500,
              color: "rgba(255, 255, 255, 0.75)",
              mt: 0.5,
            }}
          >
            {meta}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
