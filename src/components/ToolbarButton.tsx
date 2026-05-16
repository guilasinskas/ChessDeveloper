import { IconButton, Tooltip } from "@mui/material";
import { Icon } from "@iconify/react";

interface Props {
  tooltip: string;
  icon: string;
  onClick?: () => void;
  disabled?: boolean;
  iconHeight?: number;
}

export const ToolbarButton = ({
  tooltip,
  icon,
  onClick,
  disabled = false,
  iconHeight = 24,
}: Props) => {
  return (
    <Tooltip title={tooltip}>
      <span style={{ display: "inline-flex", flex: "0 0 auto" }}>
        <IconButton
          onClick={onClick}
          disabled={disabled}
          sx={{
            borderRadius: "4px",
            width: "40px",
            minWidth: "40px",
            height: "40px",
            p: 0,
            flex: "0 0 auto",
          }}
        >
          <Icon icon={icon} height={iconHeight} />
        </IconButton>
      </span>
    </Tooltip>
  );
};
