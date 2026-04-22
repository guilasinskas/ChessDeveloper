import { ANALYSIS_ROOT_ID } from "@/lib/analysisTree";
import { DEFAULT_ENGINE } from "@/constants";
import { getRecommendedWorkersNb } from "@/lib/engine/worker";
import { AnalysisTree } from "@/types/analysis";
import { EngineName } from "@/types/enums";
import { CurrentPosition, GameEval, SavedEvals } from "@/types/eval";
import { Chess, DEFAULT_POSITION } from "chess.js";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const gameEvalAtom = atom<GameEval | undefined>(undefined);
export const gameAtom = atom(new Chess());
export const boardAtom = atom(new Chess());
export const currentPositionAtom = atom<CurrentPosition>({});
export const analysisTreeAtom = atom<AnalysisTree>({
  rootId: ANALYSIS_ROOT_ID,
  rootFen: DEFAULT_POSITION,
  nextId: 1,
  nodes: {
    [ANALYSIS_ROOT_ID]: {
      id: ANALYSIS_ROOT_ID,
      parentId: null,
      children: [],
      beforeFen: DEFAULT_POSITION,
      afterFen: DEFAULT_POSITION,
      ply: 0,
      isMainline: true,
    },
  },
  mainlineNodeIds: [],
});
export const currentAnalysisNodeIdAtom = atom<string>(ANALYSIS_ROOT_ID);

export const boardOrientationAtom = atom(true);
export const showBestMoveArrowAtom = atom(true);
export const showPlayerMoveIconAtom = atom(true);

export const engineNameAtom = atom<EngineName>(DEFAULT_ENGINE);
export const engineDepthAtom = atom(14);
export const engineMultiPvAtom = atom(3);
export const engineWorkersNbAtom = atomWithStorage(
  "engineWorkersNb",
  getRecommendedWorkersNb()
);
export const evaluationProgressAtom = atom(0);

export const savedEvalsAtom = atom<SavedEvals>({});
