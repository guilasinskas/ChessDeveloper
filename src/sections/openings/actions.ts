import { atom } from "jotai";
import { type Move } from "chess.js";
import {
  REPERTOIRE_ROOT_ID,
  addMoveToTree,
  deleteSubtree,
  getAllNodesForTraining,
  getExpectedRepliesAt,
  getLastReachableNodeId,
  getNextNodeId,
  getParentNodeId,
  getRepertoireChess,
  promoteNodeToMainline,
  setNodeComment,
  toggleNodeImportant,
} from "@/lib/repertoireTree";
import { playIllegalMoveSound, playSoundFromMove } from "@/lib/sounds";
import { Color } from "@/types/enums";
import { RepertoireTree } from "@/types/openings";
import {
  currentNodeIdAtom,
  hasUnsavedChangesAtom,
  repertoireBoardAtom,
  repertoireTreeAtom,
  studyColorAtom,
  trainingActiveAtom,
  trainingStatsAtom,
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

    if (newTree !== tree) {
      set(repertoireTreeAtom, newTree);
      set(hasUnsavedChangesAtom, true);
    }
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
  if (parentId === currentNodeId) return;
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
  if (lastId === currentNodeId) return;
  set(currentNodeIdAtom, lastId);
  set(repertoireBoardAtom, getRepertoireChess(tree, lastId));
});

export const goStartRepertoireAction = atom(null, (get, set) => {
  const tree = get(repertoireTreeAtom);
  if (get(currentNodeIdAtom) === REPERTOIRE_ROOT_ID) return;
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
    set(hasUnsavedChangesAtom, true);
  }
);

export const toggleRepertoireImportantAction = atom(
  null,
  (get, set, nodeId: string) => {
    const tree = get(repertoireTreeAtom);
    const next = toggleNodeImportant(tree, nodeId);
    if (next === tree) return;
    set(repertoireTreeAtom, next);
    set(hasUnsavedChangesAtom, true);
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
    set(hasUnsavedChangesAtom, true);
  }
);

export const promoteRepertoireNodeAction = atom(
  null,
  (get, set, nodeId: string) => {
    const tree = get(repertoireTreeAtom);
    const next = promoteNodeToMainline(tree, nodeId);
    if (next === tree) return;
    set(repertoireTreeAtom, next);
    set(hasUnsavedChangesAtom, true);
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
    set(hasUnsavedChangesAtom, false);
    set(trainingActiveAtom, false);
    set(trainingStatsAtom, { total: 0, correct: 0, current: null });
  }
);

export const markRepertoireSavedAction = atom(null, (_get, set) => {
  set(hasUnsavedChangesAtom, false);
});

const pickRandomBlackStart = (
  tree: RepertoireTree,
  studyColor: Color
): string => {
  const root = tree.nodes[tree.rootId];
  if (!root) return tree.rootId;
  const startTurn = tree.rootFen.split(" ")[1];
  const myFirstMove =
    (studyColor === Color.White && startTurn === "w") ||
    (studyColor === Color.Black && startTurn === "b");
  if (myFirstMove) return tree.rootId;
  if (root.children.length === 0) return tree.rootId;
  return root.children[Math.floor(Math.random() * root.children.length)];
};

export const startTrainingAction = atom(null, (get, set): boolean => {
  const tree = get(repertoireTreeAtom);
  const studyColor = get(studyColorAtom);
  const allMyMoves = getAllNodesForTraining(tree, studyColor);
  if (allMyMoves.length === 0) {
    set(trainingActiveAtom, false);
    set(trainingStatsAtom, { total: 0, correct: 0, current: null });
    return false;
  }
  const startId =
    studyColor === Color.White
      ? tree.rootId
      : pickRandomBlackStart(tree, studyColor);
  set(currentNodeIdAtom, startId);
  set(repertoireBoardAtom, getRepertoireChess(tree, startId));
  set(trainingActiveAtom, true);
  set(trainingStatsAtom, { total: 0, correct: 0, current: null });
  return true;
});

export const stopTrainingAction = atom(null, (get, set) => {
  const tree = get(repertoireTreeAtom);
  set(trainingActiveAtom, false);
  set(currentNodeIdAtom, REPERTOIRE_ROOT_ID);
  set(repertoireBoardAtom, getRepertoireChess(tree, REPERTOIRE_ROOT_ID));
});

const trainingTimeouts = new Set<ReturnType<typeof setTimeout>>();

const scheduleTraining = (cb: () => void, ms: number) => {
  const id = setTimeout(() => {
    trainingTimeouts.delete(id);
    cb();
  }, ms);
  trainingTimeouts.add(id);
};

export const cancelTrainingTimeoutsAction = atom(null, () => {
  for (const id of trainingTimeouts) clearTimeout(id);
  trainingTimeouts.clear();
});

export const playTrainingMoveAction = atom(
  null,
  (
    get,
    set,
    params: { from: string; to: string; promotion?: string }
  ): Move | null => {
    const tree = get(repertoireTreeAtom);
    const currentNodeId = get(currentNodeIdAtom);
    const studyColor = get(studyColorAtom);
    const stats = get(trainingStatsAtom);

    const board = getRepertoireChess(tree, currentNodeId);
    let move: Move | null = null;
    try {
      move = board.move(params);
    } catch {
      playIllegalMoveSound();
      return null;
    }
    if (!move) return null;

    const expected = getExpectedRepliesAt(tree, currentNodeId);
    const playedUci = move.from + move.to + (move.promotion || "");
    const matched = expected.find((n) => n.uci === playedUci);

    const newCorrect = stats.correct + (matched ? 1 : 0);
    const newTotal = stats.total + 1;

    if (matched) {
      set(repertoireBoardAtom, board);
      set(currentNodeIdAtom, matched.id);
      playSoundFromMove(move);

      const opponentReplies = getExpectedRepliesAt(tree, matched.id);
      if (opponentReplies.length === 0) {
        set(trainingStatsAtom, {
          total: newTotal,
          correct: newCorrect,
          current: null,
        });
        scheduleTraining(() => {
          const restartedFromId = pickRandomBlackStart(tree, studyColor);
          set(currentNodeIdAtom, restartedFromId);
          set(
            repertoireBoardAtom,
            getRepertoireChess(tree, restartedFromId)
          );
        }, 1000);
        return move;
      }

      const reply =
        opponentReplies[Math.floor(Math.random() * opponentReplies.length)];
      set(trainingStatsAtom, {
        total: newTotal,
        correct: newCorrect,
        current: null,
      });
      scheduleTraining(() => {
        set(currentNodeIdAtom, reply.id);
        set(repertoireBoardAtom, getRepertoireChess(tree, reply.id));
      }, 500);
      return move;
    }

    set(repertoireBoardAtom, board);
    playSoundFromMove(move);
    set(trainingStatsAtom, {
      total: newTotal,
      correct: newCorrect,
      current: {
        fen: move.before,
        expected: expected.map((n) => n.san || n.uci || "?"),
        played: move.san,
      },
    });
    scheduleTraining(() => {
      set(repertoireBoardAtom, getRepertoireChess(tree, currentNodeId));
    }, 1500);
    return move;
  }
);
