import { AnalysisNode, AnalysisTree } from "@/types/analysis";
import { ANALYSIS_ROOT_ID } from "./analysisTree";
import { Chess, DEFAULT_POSITION, Move } from "chess.js";

type Token =
  | { kind: "moveNumber" }
  | { kind: "san"; value: string }
  | { kind: "comment"; value: string }
  | { kind: "nag"; value: number }
  | { kind: "varOpen" }
  | { kind: "varClose" }
  | { kind: "result" };

const splitHeadersFromMoves = (
  pgn: string
): { headers: string; moves: string } => {
  const trimmed = pgn.trim();
  const match = trimmed.match(/^([\s\S]*?\])\s*\n\s*\n([\s\S]*)$/);
  if (match) return { headers: match[1], moves: match[2] };
  if (trimmed.startsWith("[")) {
    return { headers: trimmed, moves: "" };
  }
  return { headers: "", moves: trimmed };
};

const extractFenHeader = (headers: string): string | null => {
  const match = headers.match(/^\[FEN\s+"([^"]+)"\]/m);
  return match ? match[1] : null;
};

const SAN_ANNOTATION_RE = /[!?]+$/;
const RESULT_TOKENS = ["1-0", "0-1", "1/2-1/2", "*"];

const tokenize = (text: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const c = text[i];

    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }

    if (c === "{") {
      let depth = 1;
      let j = i + 1;
      while (j < len && depth > 0) {
        if (text[j] === "{") depth++;
        else if (text[j] === "}") depth--;
        if (depth === 0) break;
        j++;
      }
      tokens.push({ kind: "comment", value: text.slice(i + 1, j) });
      i = j < len ? j + 1 : len;
      continue;
    }

    if (c === ";") {
      const newline = text.indexOf("\n", i);
      const end = newline === -1 ? len : newline;
      tokens.push({ kind: "comment", value: text.slice(i + 1, end).trim() });
      i = end;
      continue;
    }

    if (c === "(") {
      tokens.push({ kind: "varOpen" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ kind: "varClose" });
      i++;
      continue;
    }

    if (c === "$") {
      let j = i + 1;
      while (j < len && /\d/.test(text[j])) j++;
      const num = parseInt(text.slice(i + 1, j));
      if (!Number.isNaN(num)) tokens.push({ kind: "nag", value: num });
      i = j;
      continue;
    }

    let matchedResult: string | null = null;
    for (const r of RESULT_TOKENS) {
      if (text.startsWith(r, i)) {
        const charBefore = i === 0 ? " " : text[i - 1];
        const charAfter = i + r.length >= len ? " " : text[i + r.length];
        const isBoundary = /[\s)]/.test(charBefore) && /[\s)]/.test(charAfter);
        if (isBoundary || i === 0) {
          matchedResult = r;
          break;
        }
      }
    }
    if (matchedResult) {
      tokens.push({ kind: "result" });
      i += matchedResult.length;
      continue;
    }

    const moveNumberMatch = text.slice(i).match(/^\d+\s*(\.\.\.|\.)/);
    if (moveNumberMatch) {
      tokens.push({ kind: "moveNumber" });
      i += moveNumberMatch[0].length;
      continue;
    }

    const sanMatch = text.slice(i).match(/^([^\s(){};$]+)/);
    if (sanMatch) {
      const value = sanMatch[0];
      const isPureNumber = /^\d+$/.test(value);
      if (!isPureNumber) tokens.push({ kind: "san", value });
      i += value.length;
      continue;
    }

    i++;
  }

  return tokens;
};

const tryMove = (chess: Chess, san: string): Move | null => {
  const tries = [san, san.replace(/0/g, "O"), san.replace(/O/g, "0")];
  for (const candidate of tries) {
    try {
      return chess.move(candidate);
    } catch {
      continue;
    }
  }
  return null;
};

interface BranchState {
  parentId: string;
  chess: Chess;
  isMainlineBranch: boolean;
  startedFromMoveId: string | null;
}

export const createAnalysisTreeFromPgn = (rawPgn: string): AnalysisTree => {
  const { headers, moves } = splitHeadersFromMoves(rawPgn);
  const rootFen = extractFenHeader(headers) ?? DEFAULT_POSITION;

  const tree: AnalysisTree = {
    rootId: ANALYSIS_ROOT_ID,
    rootFen,
    nextId: 1,
    nodes: {
      [ANALYSIS_ROOT_ID]: {
        id: ANALYSIS_ROOT_ID,
        parentId: null,
        children: [],
        beforeFen: rootFen,
        afterFen: rootFen,
        ply: 0,
        isMainline: true,
      },
    },
    mainlineNodeIds: [],
  };

  const tokens = tokenize(moves);

  const stack: BranchState[] = [
    {
      parentId: ANALYSIS_ROOT_ID,
      chess: new Chess(rootFen),
      isMainlineBranch: true,
      startedFromMoveId: null,
    },
  ];

  const attachComment = (nodeId: string, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (nodeId === ANALYSIS_ROOT_ID) {
      tree.rootComment = tree.rootComment
        ? `${tree.rootComment} ${trimmed}`
        : trimmed;
      return;
    }
    const node = tree.nodes[nodeId];
    if (!node) return;
    node.comment = node.comment ? `${node.comment} ${trimmed}` : trimmed;
  };

  const attachNag = (nodeId: string, value: number) => {
    if (nodeId === ANALYSIS_ROOT_ID) return;
    const node = tree.nodes[nodeId];
    if (!node) return;
    node.nags = [...(node.nags ?? []), value];
  };

  for (const token of tokens) {
    const top = stack[stack.length - 1];

    if (token.kind === "moveNumber" || token.kind === "result") continue;

    if (token.kind === "comment") {
      attachComment(top.parentId, token.value);
      continue;
    }

    if (token.kind === "nag") {
      attachNag(top.parentId, token.value);
      continue;
    }

    if (token.kind === "varOpen") {
      const lastMoveId = top.parentId;
      const lastMoveNode = tree.nodes[lastMoveId];
      if (!lastMoveNode || !lastMoveNode.parentId) continue;
      stack.push({
        parentId: lastMoveNode.parentId,
        chess: new Chess(lastMoveNode.beforeFen),
        isMainlineBranch: false,
        startedFromMoveId: lastMoveId,
      });
      continue;
    }

    if (token.kind === "varClose") {
      if (stack.length > 1) stack.pop();
      continue;
    }

    if (token.kind === "san") {
      const cleanSan = token.value.replace(SAN_ANNOTATION_RE, "");
      const annotationSuffix = token.value.slice(cleanSan.length);
      const move = tryMove(top.chess, cleanSan);
      if (!move) continue;

      const uci = move.from + move.to + (move.promotion || "");
      const parentNode = tree.nodes[top.parentId];
      let childId = parentNode.children.find(
        (id) => tree.nodes[id]?.uci === uci
      );

      if (!childId) {
        const newId = `node-${tree.nextId++}`;
        const isFirstChild = parentNode.children.length === 0;
        const newNode: AnalysisNode = {
          id: newId,
          parentId: parentNode.id,
          children: [],
          san: move.san,
          uci,
          beforeFen: move.before,
          afterFen: move.after,
          ply: parentNode.ply + 1,
          color: move.color,
          isMainline: top.isMainlineBranch && isFirstChild,
        };
        tree.nodes[newId] = newNode;
        parentNode.children.push(newId);
        if (newNode.isMainline) tree.mainlineNodeIds.push(newId);
        childId = newId;
      }

      if (annotationSuffix) {
        const nags = annotationToNags(annotationSuffix);
        for (const n of nags) attachNag(childId, n);
      }

      stack[stack.length - 1] = { ...top, parentId: childId };
      continue;
    }
  }

  return tree;
};

const annotationToNags = (annotation: string): number[] => {
  switch (annotation) {
    case "!":
      return [1];
    case "?":
      return [2];
    case "!!":
      return [3];
    case "??":
      return [4];
    case "!?":
      return [5];
    case "?!":
      return [6];
    default:
      return [];
  }
};
