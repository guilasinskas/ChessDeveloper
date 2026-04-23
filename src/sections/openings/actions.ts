import { atom } from "jotai";
import { type Move } from "chess.js";
import {
  REPERTOIRE_ROOT_ID,
  addMoveToTree,
  deleteSubtree,
  getLastReachableNodeId,
  getNextNodeId,
  getParentNodeId,
  getRepertoireChess,
  promoteNodeToMainline,
  setNodeComment,
  toggleNodeImportant,
} from "@/lib/repertoireTree";
import { playIllegalMoveSound, playSoundFromMove } from "@/lib/sounds";
import { RepertoireTree } from "@/types/openings";
import {
  currentNodeIdAtom,
  repertoireBoardAtom,
  repertoireTreeAtom,
} from "./states";

export const playRepertoireMoveAction = atom(
  null,
  (
    get,
    set,
    params: { from: string; to: string; promotion?: string }
  ): Move | null => {
    const tree = get(repertoireTreeAtom);
    const currentNodeId = get(currentNodeIdAtom);
    const board = getRepertoireChess(tree, currentNodeId);

    let result: Move | null = null;
    try {
      result = board.move(params);
    } catch {
      playIllegalMoveSound();
      return null;
    }
    if (!result) return null;

    const { tree: newTree, nodeId } = addMoveToTree(
      tree,
      currentNodeId,
      result
    );

    set(repertoireTreeAtom, newTree);
    set(currentNodeIdAtom, nodeId);
    set(repertoireBoardAtom, board);
    playSoundFromMove(result);
    return result;
  }
);

export const goToRepertoireNodeAction = atom(
  null,
  (get, set, nodeId: string) => {
    const tree = get(repertoireTreeAtom);
    set(currentNodeIdAtom, nodeId);
    set(repertoireBoardAtom, getRepertoireChess(tree, nodeId));
  }
);

export const goPrevRepertoireAction = atom(null, (get, set) => {
  const tree = get(repertoireTreeAtom);
  const currentNodeId = get(currentNodeIdAtom);
  const parentId = getParentNodeId(tree, currentNodeId);
  set(currentNodeIdAtom, parentId);
  set(repertoireBoardAtom, getRepertoireChess(tree, parentId));
});

export const goNextRepertoireAction = atom(null, (get, set) => {
  const tree = get(repertoireTreeAtom);
  const currentNodeId = get(currentNodeIdAtom);
  const nextId = getNextNodeId(tree, currentNodeId);
  if (!nextId) return;
  set(currentNodeIdAtom, nextId);
  set(repertoireBoardAtom, getRepertoireChess(tree, nextId));
});

export const goLastRepertoireAction = atom(null, (get, set) => {
  const tree = get(repertoireTreeAtom);
  const currentNodeId = get(currentNodeIdAtom);
  const lastId = getLastReachableNodeId(tree, currentNodeId);
  set(currentNodeIdAtom, lastId);
  set(repertoireBoardAtom, getRepertoireChess(tree, lastId));
});

export const goStartRepertoireAction = atom(null, (get, set) => {
  const tree = get(repertoireTreeAtom);
  set(currentNodeIdAtom, REPERTOIRE_ROOT_ID);
  set(repertoireBoardAtom, getRepertoireChess(tree, REPERTOIRE_ROOT_ID));
});

export const setRepertoireCommentAction = atom(
  null,
  (get, set, params: { nodeId: string; comment: string }) => {
    const tree = get(repertoireTreeAtom);
    const next = setNodeComment(tree, params.nodeId, params.comment);
    if (next === tree) return;
    set(repertoireTreeAtom, next);
  }
);

export const toggleRepertoireImportantAction = atom(
  null,
  (get, set, nodeId: string) => {
    const tree = get(repertoireTreeAtom);
    const next = toggleNodeImportant(tree, nodeId);
    if (next === tree) return;
    set(repertoireTreeAtom, next);
  }
);

export const deleteRepertoireSubtreeAction = atom(
  null,
  (get, set, nodeId: string) => {
    const tree = get(repertoireTreeAtom);
    const { tree: next, newCurrentId } = deleteSubtree(tree, nodeId);
    if (next === tree) return;
    set(repertoireTreeAtom, next);
    set(currentNodeIdAtom, newCurrentId);
    set(repertoireBoardAtom, getRepertoireChess(next, newCurrentId));
  }
);

export const promoteRepertoireNodeAction = atom(
  null,
  (get, set, nodeId: string) => {
    const tree = get(repertoireTreeAtom);
    const next = promoteNodeToMainline(tree, nodeId);
    if (next === tree) return;
    set(repertoireTreeAtom, next);
  }
);

export const initializeRepertoireAction = atom(
  null,
  (_get, set, params: { tree: RepertoireTree }) => {
    set(repertoireTreeAtom, params.tree);
    set(currentNodeIdAtom, REPERTOIRE_ROOT_ID);
    set(
      repertoireBoardAtom,
      getRepertoireChess(params.tree, REPERTOIRE_ROOT_ID)
    );
  }
);
