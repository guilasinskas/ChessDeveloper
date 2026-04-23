import { Color } from "@/types/enums";
import { Repertoire, RepertoireTree } from "@/types/openings";
import {
  REPERTOIRE_ROOT_ID,
  createEmptyRepertoireTree,
  getRepertoireChess,
} from "@/lib/repertoireTree";
import { Chess } from "chess.js";
import { atom } from "jotai";

export const currentRepertoireAtom = atom<Repertoire | null>(null);

export const repertoireTreeAtom = atom<RepertoireTree>(
  createEmptyRepertoireTree()
);

export const currentNodeIdAtom = atom<string>(REPERTOIRE_ROOT_ID);

export const repertoireBoardAtom = atom<Chess>(new Chess());

export const studyColorAtom = atom<Color>(Color.White);

export const trainingActiveAtom = atom<boolean>(false);
export const trainingStatsAtom = atom<{
  total: number;
  correct: number;
  current: { fen: string; expected: string[]; played?: string } | null;
}>({ total: 0, correct: 0, current: null });

export const repertoireBoardOrientationAtom = atom<Color>(Color.White);

export const updateBoardForNode = (
  tree: RepertoireTree,
  nodeId: string
): Chess => getRepertoireChess(tree, nodeId);
