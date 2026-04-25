import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { UciEngine } from "@/lib/engine/uciEngine";
import {
  currentNodeIdAtom,
  repertoireBoardAtom,
  repertoireCurrentPositionAtom,
} from "@/sections/openings/states";
import { PositionEval } from "@/types/eval";

const DEPTH = 18;
const MULTI_PV = 3;

export const useRepertoireEngine = (engine: UciEngine | null) => {
  const currentNodeId = useAtomValue(currentNodeIdAtom);
  const board = useAtomValue(repertoireBoardAtom);
  const setCurrentPosition = useSetAtom(repertoireCurrentPositionAtom);

  useEffect(() => {
    const history = board.history({ verbose: true });
    const lastMove = history.at(-1);
    const position = { lastMove };

    setCurrentPosition(position);

    if (!engine?.getIsReady() || board.isGameOver()) return;

    const fen = board.fen();

    const run = async () => {
      try {
        await engine.evaluatePositionWithUpdate({
          fen,
          depth: DEPTH,
          multiPv: MULTI_PV,
          setPartialEval: (positionEval: PositionEval) => {
            setCurrentPosition({ ...position, eval: positionEval });
          },
        });
      } catch {
        // engine shut down or not ready
      }
    };

    run();

    return () => {
      if (engine.getIsReady()) engine.stopAllCurrentJobs();
    };
  // currentNodeId is the reliable trigger — it's a string (value comparison),
  // which avoids any reference-equality issues with Chess objects.
  // board is read inside the effect but included in deps for correctness.
  }, [currentNodeId, board, engine, setCurrentPosition]);
};
