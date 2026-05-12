import { isWasmSupported } from "@/lib/engine/shared";
import { Stockfish11 } from "@/lib/engine/stockfish11";
import { Stockfish18 } from "@/lib/engine/stockfish18";
import { UciEngine } from "@/lib/engine/uciEngine";
import { EngineName } from "@/types/enums";
import { useEffect, useState } from "react";

export const useEngine = (engineName: EngineName | undefined) => {
  const [engine, setEngine] = useState<UciEngine | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!engineName) return;

    if (engineName !== EngineName.Stockfish11 && !isWasmSupported()) {
      return;
    }

    pickEngine(engineName).then((newEngine) => {
      if (!isMounted) {
        newEngine.shutdown();
        return;
      }

      setEngine((prev) => {
        prev?.shutdown();
        return newEngine;
      });
    });

    return () => {
      isMounted = false;
    };
  }, [engineName]);

  return engine;
};

const pickEngine = (engine: EngineName): Promise<UciEngine> => {
  switch (engine) {
    case EngineName.Stockfish18:
      return Stockfish18.create(false);
    case EngineName.Stockfish18Lite:
      return Stockfish18.create(true);
    case EngineName.Stockfish11:
      return Stockfish11.create();
  }
};
