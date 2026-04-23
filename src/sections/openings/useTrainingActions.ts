import {
  REPERTOIRE_ROOT_ID,
  getExpectedRepliesAt,
  getAllNodesForTraining,
  getRepertoireChess,
} from "@/lib/repertoireTree";
import { Color } from "@/types/enums";
import { RepertoireTree } from "@/types/openings";
import { Move } from "chess.js";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import {
  currentNodeIdAtom,
  repertoireBoardAtom,
  repertoireTreeAtom,
  studyColorAtom,
  trainingActiveAtom,
  trainingStatsAtom,
} from "./states";

export const useTrainingActions = () => {
  const tree = useAtomValue(repertoireTreeAtom);
  const studyColor = useAtomValue(studyColorAtom);
  const setBoard = useSetAtom(repertoireBoardAtom);
  const [currentNodeId, setCurrentNodeId] = useAtom(currentNodeIdAtom);
  const [trainingActive, setTrainingActive] = useAtom(trainingActiveAtom);
  const [stats, setStats] = useAtom(trainingStatsAtom);

  const startTraining = useCallback(() => {
    const allMyMoves = getAllNodesForTraining(tree, studyColor);
    if (allMyMoves.length === 0) {
      setTrainingActive(false);
      setStats({ total: 0, correct: 0, current: null });
      return false;
    }

    const startId =
      studyColor === Color.White
        ? tree.rootId
        : pickRandomBlackStart(tree, studyColor) ?? tree.rootId;

    setCurrentNodeId(startId);
    setBoard(getRepertoireChess(tree, startId));
    setTrainingActive(true);
    setStats({ total: 0, correct: 0, current: null });
    return true;
  }, [tree, studyColor, setCurrentNodeId, setBoard, setTrainingActive, setStats]);

  const stopTraining = useCallback(() => {
    setTrainingActive(false);
    setCurrentNodeId(REPERTOIRE_ROOT_ID);
    setBoard(getRepertoireChess(tree, REPERTOIRE_ROOT_ID));
  }, [setTrainingActive, setCurrentNodeId, setBoard, tree]);

  const handleTrainingMove = useCallback(
    (move: Move) => {
      const expected = getExpectedRepliesAt(tree, currentNodeId);
      const playedUci = move.from + move.to + (move.promotion || "");
      const matched = expected.find((n) => n.uci === playedUci);

      const newCorrect = stats.correct + (matched ? 1 : 0);
      const newTotal = stats.total + 1;

      if (matched) {
        const myNodeId = matched.id;

        setCurrentNodeId(myNodeId);
        setBoard(getRepertoireChess(tree, myNodeId));

        const opponentReplies = getExpectedRepliesAt(tree, myNodeId);
        if (opponentReplies.length === 0) {
          setStats({ total: newTotal, correct: newCorrect, current: null });
          setTimeout(() => {
            const restartedFromId =
              studyColor === Color.White
                ? tree.rootId
                : pickRandomBlackStart(tree, studyColor) ?? tree.rootId;
            setCurrentNodeId(restartedFromId);
            setBoard(getRepertoireChess(tree, restartedFromId));
          }, 1000);
          return;
        }

        const reply =
          opponentReplies[Math.floor(Math.random() * opponentReplies.length)];
        setStats({ total: newTotal, correct: newCorrect, current: null });
        setTimeout(() => {
          setCurrentNodeId(reply.id);
          setBoard(getRepertoireChess(tree, reply.id));
        }, 500);
      } else {
        setStats({
          total: newTotal,
          correct: newCorrect,
          current: {
            fen: move.before,
            expected: expected.map((n) => n.san || n.uci || "?"),
            played: move.san,
          },
        });
        setTimeout(() => {
          setBoard(getRepertoireChess(tree, currentNodeId));
        }, 1500);
      }
    },
    [tree, currentNodeId, stats, setStats, setCurrentNodeId, setBoard, studyColor]
  );

  return {
    trainingActive,
    stats,
    startTraining,
    stopTraining,
    handleTrainingMove,
  };
};

const pickRandomBlackStart = (
  tree: RepertoireTree,
  studyColor: Color
): string | null => {
  const root = tree.nodes[tree.rootId];
  if (!root) return null;
  const startTurn = tree.rootFen.split(" ")[1];
  const myFirstMove =
    (studyColor === Color.White && startTurn === "w") ||
    (studyColor === Color.Black && startTurn === "b");

  if (myFirstMove) {
    return tree.rootId;
  }

  if (root.children.length === 0) return null;
  return root.children[Math.floor(Math.random() * root.children.length)];
};
