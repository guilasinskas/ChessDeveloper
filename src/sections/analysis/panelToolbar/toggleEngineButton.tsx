import { ToolbarButton } from "@/components/ToolbarButton";
import { useAtomLocalStorage } from "@/hooks/useAtomLocalStorage";
import { showEngineAtom } from "../states";

export default function ToggleEngineButton() {
  const [showEngine, setShowEngine] = useAtomLocalStorage(
    "show-engine",
    showEngineAtom
  );

  return (
    <ToolbarButton
      tooltip={
        showEngine
          ? "Hide engine (focus mode)"
          : "Show engine (eval bar, lines, best move)"
      }
      onClick={() => setShowEngine((v) => !v)}
      icon={showEngine ? "mdi:robot-outline" : "mdi:robot-off-outline"}
    />
  );
}
