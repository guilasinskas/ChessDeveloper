import { Box, IconButton, Tooltip, Typography, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import { useCallback, useRef, useState } from "react";
import { CC } from "@/constants";
import { NoteImage } from "@/types/notes";
import { noteImageUrl, useNotesDatabase } from "@/hooks/useNotesDatabase";

interface Props {
  imageIds: string[];
  onChange: (next: string[]) => void;
  size?: "sm" | "md";
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

export default function NoteImageUploader({
  imageIds,
  onChange,
  size = "md",
}: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { uploadImage, deleteImage, images } = useNotesDatabase();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxId, setLightboxId] = useState<string | null>(null);

  const tileSize = size === "sm" ? 64 : 96;

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (list.length === 0) return;
      setError(null);
      setIsUploading(true);
      try {
        const uploaded: NoteImage[] = [];
        for (const f of list) {
          try {
            const meta = await uploadImage(f);
            uploaded.push(meta);
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Upload failed";
            setError(msg);
          }
        }
        if (uploaded.length > 0) {
          onChange([...imageIds, ...uploaded.map((u) => u.id)]);
        }
      } finally {
        setIsUploading(false);
      }
    },
    [imageIds, onChange, uploadImage]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const files: File[] = [];
      for (const item of Array.from(e.clipboardData.items)) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        uploadFiles(files);
      }
    },
    [uploadFiles]
  );

  const handleRemove = async (id: string) => {
    onChange(imageIds.filter((iid) => iid !== id));
    await deleteImage(id);
  };

  const lightboxMeta = lightboxId
    ? images.find((i) => i.id === lightboxId)
    : null;

  return (
    <Box
      onPaste={handlePaste}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
      }}
      sx={{
        border: `1.5px dashed ${
          isDragging ? CC.primary : isDark ? CC.border : CC.lBorder
        }`,
        borderRadius: "8px",
        p: 1.5,
        backgroundColor: isDragging
          ? CC.primarySubtle
          : isDark
            ? CC.bg0
            : CC.lBg2,
        transition: "all 120ms ease",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: imageIds.length > 0 ? 1.5 : 0,
        }}
      >
        <Icon
          icon="material-symbols:image-outline"
          width={16}
          color={isDark ? CC.textSub : CC.lTextSub}
        />
        <Typography
          sx={{
            fontSize: 12,
            color: isDark ? CC.textSub : CC.lTextSub,
            flex: 1,
          }}
        >
          {imageIds.length === 0
            ? "Drop, paste, or click to add reference images"
            : `${imageIds.length} image${imageIds.length !== 1 ? "s" : ""}`}
        </Typography>
        <Tooltip title="Add images">
          <IconButton
            size="small"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            sx={{ color: CC.primary }}
          >
            <Icon
              icon={
                isUploading
                  ? "eos-icons:loading"
                  : "material-symbols:add-photo-alternate-outline"
              }
              width={18}
            />
          </IconButton>
        </Tooltip>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </Box>

      {error && (
        <Typography
          sx={{
            fontSize: 11,
            color: "#c45c5c",
            mb: imageIds.length > 0 ? 1 : 0,
          }}
        >
          {error}
        </Typography>
      )}

      {imageIds.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fill, minmax(${tileSize}px, 1fr))`,
            gap: 0.75,
          }}
        >
          {imageIds.map((id) => (
            <Box
              key={id}
              sx={{
                position: "relative",
                width: "100%",
                paddingBottom: "100%",
                borderRadius: "6px",
                overflow: "hidden",
                border: `1px solid ${isDark ? CC.border : CC.lBorder}`,
                cursor: "zoom-in",
                "&:hover .img-actions": { opacity: 1 },
              }}
              onClick={() => setLightboxId(id)}
            >
              <Box
                component="img"
                src={noteImageUrl(id)}
                alt="reference"
                sx={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <Box
                className="img-actions"
                sx={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  opacity: 0,
                  transition: "opacity 100ms ease",
                  display: "flex",
                  gap: 0.25,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Tooltip title="Remove">
                  <IconButton
                    size="small"
                    onClick={() => handleRemove(id)}
                    sx={{
                      backgroundColor: "rgba(0,0,0,0.65)",
                      color: "#fff",
                      width: 22,
                      height: 22,
                      "&:hover": { backgroundColor: "#c45c5c" },
                    }}
                  >
                    <Icon icon="mdi:close" width={13} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {lightboxId && (
        <Box
          onClick={() => setLightboxId(null)}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1500,
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
            cursor: "zoom-out",
          }}
        >
          <Box
            component="img"
            src={noteImageUrl(lightboxId)}
            alt={lightboxMeta?.filename ?? ""}
            sx={{
              maxWidth: "100%",
              maxHeight: "100%",
              borderRadius: "8px",
              boxShadow: "0 16px 64px rgba(0,0,0,0.6)",
            }}
          />
        </Box>
      )}
    </Box>
  );
}
