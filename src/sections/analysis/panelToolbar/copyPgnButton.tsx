import { useAtomValue } from "jotai";
import { analysisTreeAtom, gameAtom } from "../states";
import { ToolbarButton } from "@/components/ToolbarButton";
import { exportTreeToPgn } from "@/lib/analysisTree";

export const CopyPgnButton = () => {
  const game = useAtomValue(gameAtom);
  const tree = useAtomValue(analysisTreeAtom);

  const hasMoves =
    game.history().length > 0 ||
    !!tree.nodes[tree.rootId]?.children?.length;

  return (
    <ToolbarButton
      tooltip="Copy PGN"
      onClick={() => {
        const headers = game.getHeaders() as Record<string, string | undefined>;
        const treeHasMoves = !!tree.nodes[tree.rootId]?.children?.length;
        const pgn = treeHasMoves
          ? exportTreeToPgn(tree, headers)
          : game.pgn();
        navigator.clipboard?.writeText?.(pgn);
      }}
      icon="ri:clipboard-line"
      disabled={!hasMoves}
    />
  );
};
