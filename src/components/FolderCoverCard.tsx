import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useRef } from "react";

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
  /**
   * Called with the file the user picked / dropped. Enables the small
   * camera button in the top-right corner of the card. Omit to render
   * the card as a read-only thumbnail.
   */
  onUploadCover?: (file: File) => void;
  /**
   * Called when the user wants to drop the custom cover and fall back
   * to the default photo. Only relevant when a custom cover is set
   * (i.e. `hasCustomCover` is true).
   */
  onClearCover?: () => void;
  /** True when the displayed cover is a user-uploaded image. */
  hasCustomCover?: boolean;
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
  onUploadCover,
  onClearCover,
  hasCustomCover = false,
}: FolderCoverCardProps) {
  const src = cover ?? coverForName(title);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
        "&:hover .cover-actions": onUploadCover ? { opacity: 1 } : undefined,
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

      {/* Upload / clear cover actions — visible on hover when onUploadCover
          is provided. Stop click propagation so clicking these doesn't
          select the folder. */}
      {onUploadCover && (
        <Box
          className="cover-actions"
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            gap: 0.5,
            opacity: { xs: 1, md: 0 },
            transition: "opacity 120ms ease",
            zIndex: 1,
          }}
        >
          <Tooltip title={hasCustomCover ? "Replace image" : "Upload image"}>
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.55)",
                color: "#fff",
                width: 28,
                height: 28,
                "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.75)" },
              }}
            >
              <Icon icon="material-symbols:photo-camera-outline" width={16} />
            </IconButton>
          </Tooltip>

          {hasCustomCover && onClearCover && (
            <Tooltip title="Restore default image">
              <IconButton
                size="small"
                onClick={onClearCover}
                sx={{
                  backgroundColor: "rgba(0, 0, 0, 0.55)",
                  color: "#fff",
                  width: 28,
                  height: 28,
                  "&:hover": { backgroundColor: "#c45c5c" },
                }}
              >
                <Icon icon="mdi:close" width={14} />
              </IconButton>
            </Tooltip>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadCover(file);
              e.target.value = "";
            }}
          />
        </Box>
      )}

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
