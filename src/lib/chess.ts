import { EvaluateGameParams, LineEval, PositionEval } from "@/types/eval";
import { Game, Player } from "@/types/game";
import { Chess, PieceSymbol, Square } from "chess.js";
import { getPositionWinPercentage } from "./engine/helpers/winPercentage";
import { Color } from "@/types/enums";
import { Piece } from "react-chessboard/dist/chessboard/types";

export const getEvaluateGameParams = (game: Chess): EvaluateGameParams => {
  const history = game.history({ verbose: true });

  const fens = history.map((move) => move.before);
  fens.push(history[history.length - 1].after);

  const uciMoves = history.map(
    (move) => move.from + move.to + (move.promotion || "")
  );

  return { fens, uciMoves };
};

export const stripPgnVariations = (pgn: string): string => {
  let depth = 0;
  let result = "";
  for (let i = 0; i < pgn.length; i++) {
    const c = pgn[i];
    if (c === "{") {
      const end = pgn.indexOf("}", i);
      if (end === -1) {
        result += pgn.slice(i);
        break;
      }
      if (depth === 0) result += pgn.slice(i, end + 1);
      i = end;
      continue;
    }
    if (c === "(") {
      depth++;
      continue;
    }
    if (c === ")") {
      if (depth > 0) depth--;
      continue;
    }
    if (depth === 0) result += c;
  }
  return result.replace(/[ \t]+/g, " ").replace(/\n /g, "\n");
};

export const normalizeCastling = (pgn: string): string =>
  pgn.replace(/\b0-0-0\b/g, "O-O-O").replace(/\b0-0\b/g, "O-O");

export const getGameFromPgn = (pgn: string): Chess => {
  const game = new Chess();
  const normalized = normalizeCastling(pgn);
  try {
    game.loadPgn(normalized);
  } catch {
    game.loadPgn(stripPgnVariations(normalized));
  }
  return game;
};

export const getGamesFromPgn = (pgn: string): Chess[] => {
  const pgnBlocks = pgn
    .split(/\n(?=\[Event )/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  const games: Chess[] = [];
  for (const block of pgnBlocks) {
    try {
      games.push(getGameFromPgn(block));
    } catch {
      // skip invalid game blocks
    }
  }

  if (games.length > 0) return games;
  try {
    return [getGameFromPgn(pgn)];
  } catch {
    return [getGameFromPgn(stripPgnVariations(pgn))];
  }
};

export const formatGameToDatabase = (game: Chess): Omit<Game, "id"> => {
  const headers: Record<string, string | undefined> = game.getHeaders();

  return {
    pgn: game.pgn(),
    event: headers.Event,
    site: headers.Site,
    date: headers.Date,
    round: headers.Round ?? "?",
    white: {
      name: headers.White || "White",
      rating: headers.WhiteElo ? Number(headers.WhiteElo) : undefined,
    },
    black: {
      name: headers.Black || "Black",
      rating: headers.BlackElo ? Number(headers.BlackElo) : undefined,
    },
    result: headers.Result,
    termination: headers.Termination,
    timeControl: headers.TimeControl,
  };
};

export const getGameToSave = (game: Chess, board: Chess): Chess => {
  if (game.history().length) return game;
  return setGameHeaders(board);
};

export const setGameHeaders = (
  game: Chess,
  params: { white?: Player; black?: Player; resigned?: Color } = {}
): Chess => {
  game.setHeader("Event", "Chesskit Game");
  game.setHeader("Site", "Chesskit.org");
  game.setHeader(
    "Date",
    new Date().toISOString().split("T")[0].replace(/-/g, ".")
  );

  const { white, black, resigned } = params;

  const whiteHeader = game.getHeaders().White;
  const blackHeader = game.getHeaders().Black;
  const whiteName =
    white?.name || (whiteHeader !== "?" ? whiteHeader : "White");
  const blackName =
    black?.name || (blackHeader !== "?" ? blackHeader : "Black");

  game.setHeader("White", whiteName);
  game.setHeader("Black", blackName);

  if (white?.rating) game.setHeader("WhiteElo", `${white.rating}`);
  if (black?.rating) game.setHeader("BlackElo", `${black.rating}`);

  if (resigned) {
    game.setHeader("Result", resigned === "w" ? "0-1" : "1-0");
    game.setHeader(
      "Termination",
      `${resigned === "w" ? blackName : whiteName} won by resignation`
    );
  }

  if (!game.isGameOver()) return game;

  if (game.isCheckmate()) {
    game.setHeader("Result", game.turn() === "w" ? "0-1" : "1-0");
    game.setHeader(
      "Termination",
      `${game.turn() === "w" ? blackName : whiteName} won by checkmate`
    );
  }

  if (game.isInsufficientMaterial()) {
    game.setHeader("Result", "1/2-1/2");
    game.setHeader("Termination", "Draw by insufficient material");
  }

  if (game.isStalemate()) {
    game.setHeader("Result", "1/2-1/2");
    game.setHeader("Termination", "Draw by stalemate");
  }

  if (game.isThreefoldRepetition()) {
    game.setHeader("Result", "1/2-1/2");
    game.setHeader("Termination", "Draw by threefold repetition");
  }

  return game;
};

export const moveLineUciToSan = (
  fen: string
): ((moveUci: string) => string) => {
  const game = new Chess(fen);

  return (moveUci: string): string => {
    try {
      const move = game.move(uciMoveParams(moveUci));
      return move.san;
    } catch {
      return moveUci;
    }
  };
};

export const getSanPvLine = (fen: string, uciMoves: string[]): string[] => {
  const uciToSan = moveLineUciToSan(fen);
  return uciMoves.map(uciToSan);
};

export const getEvaluationBarValue = (
  position: PositionEval
): { whiteBarPercentage: number; label: string } => {
  const whiteBarPercentage = getPositionWinPercentage(position);
  const bestLine = position.lines[0];

  if (bestLine.mate) {
    return { label: `M${Math.abs(bestLine.mate)}`, whiteBarPercentage };
  }

  const cp = bestLine.cp;
  if (!cp) return { whiteBarPercentage, label: "0.0" };

  const pEval = Math.abs(cp) / 100;
  let label = pEval.toFixed(1);

  if (label.toString().length > 3) {
    label = pEval.toFixed(0);
  }

  return { whiteBarPercentage, label };
};

export const getIsStalemate = (fen: string): boolean => {
  const game = new Chess(fen);
  return game.isStalemate();
};

export const getWhoIsCheckmated = (fen: string): "w" | "b" | null => {
  const game = new Chess(fen);
  if (!game.isCheckmate()) return null;
  return game.turn();
};

export const uciMoveParams = (
  uciMove: string
): {
  from: Square;
  to: Square;
  promotion?: string | undefined;
} => ({
  from: uciMove.slice(0, 2) as Square,
  to: uciMove.slice(2, 4) as Square,
  promotion: uciMove.slice(4, 5) || undefined,
});

export const isSimplePieceRecapture = (
  fen: string,
  uciMoves: [string, string]
): boolean => {
  const game = new Chess(fen);
  const moves = uciMoves.map((uciMove) => uciMoveParams(uciMove));

  if (moves[0].to !== moves[1].to) return false;

  const piece = game.get(moves[0].to);
  if (piece) return true;

  return false;
};

export const getIsPieceSacrifice = (
  fen: string,
  playedMove: string,
  bestLinePvToPlay: string[]
): boolean => {
  if (!bestLinePvToPlay.length) return false;

  const game = new Chess(fen);
  const whiteToPlay = game.turn() === "w";
  const startingMaterialDifference = getMaterialDifference(fen);

  let moves = [playedMove, ...bestLinePvToPlay];
  if (moves.length % 2 === 1) {
    moves = moves.slice(0, -1);
  }
  let nonCapturingMovesTemp = 1;

  const capturedPieces: { w: PieceSymbol[]; b: PieceSymbol[] } = {
    w: [],
    b: [],
  };
  for (const move of moves) {
    try {
      const fullMove = game.move(uciMoveParams(move));
      if (fullMove.captured) {
        capturedPieces[fullMove.color].push(fullMove.captured);
        nonCapturingMovesTemp = 1;
      } else {
        nonCapturingMovesTemp--;
        if (nonCapturingMovesTemp < 0) break;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  for (const p of capturedPieces["w"].slice(0)) {
    if (capturedPieces["b"].includes(p)) {
      capturedPieces["b"].splice(capturedPieces["b"].indexOf(p), 1);
      capturedPieces["w"].splice(capturedPieces["w"].indexOf(p), 1);
    }
  }

  if (
    Math.abs(capturedPieces["w"].length - capturedPieces["b"].length) <= 1 &&
    capturedPieces["w"].concat(capturedPieces["b"]).every((p) => p === "p")
  ) {
    return false;
  }

  const endingMaterialDifference = getMaterialDifference(game.fen());

  const materialDiff = endingMaterialDifference - startingMaterialDifference;
  const materialDiffPlayerRelative = whiteToPlay ? materialDiff : -materialDiff;

  return materialDiffPlayerRelative < 0;
};

export const getMaterialDifference = (fen: string): number => {
  const game = new Chess(fen);
  const board = game.board().flat();

  return board.reduce((acc, square) => {
    if (!square) return acc;
    const piece = square.type;

    if (square.color === "w") {
      return acc + getPieceValue(piece);
    }

    return acc - getPieceValue(piece);
  }, 0);
};

const getPieceValue = (piece: PieceSymbol): number => {
  switch (piece) {
    case "p":
      return 1;
    case "n":
      return 3;
    case "b":
      return 3;
    case "r":
      return 5;
    case "q":
      return 9;
    default:
      return 0;
  }
};

export const isCheck = (fen: string): boolean => {
  const game = new Chess(fen);
  return game.inCheck();
};

export const getCapturedPieces = (
  fen: string,
  color: Color
): {
  piece: string;
  count: number;
}[] => {
  const capturedPieces =
    color === Color.White
      ? [
          { piece: "p", count: 8 },
          { piece: "b", count: 2 },
          { piece: "n", count: 2 },
          { piece: "r", count: 2 },
          { piece: "q", count: 1 },
        ]
      : [
          { piece: "P", count: 8 },
          { piece: "B", count: 2 },
          { piece: "N", count: 2 },
          { piece: "R", count: 2 },
          { piece: "Q", count: 1 },
        ];

  const fenPiecePlacement = fen.split(" ")[0];

  return capturedPieces.map(({ piece, count }) => {
    const piecesLeftCount = fenPiecePlacement.match(
      new RegExp(piece, "g")
    )?.length;
    const newPiece = pieceFenToSymbol[piece] ?? piece;

    return {
      piece: newPiece,
      count: Math.max(0, count - (piecesLeftCount ?? 0)),
    };
  });
};

const pieceFenToSymbol: Record<string, Piece | undefined> = {
  p: "bP",
  b: "bB",
  n: "bN",
  r: "bR",
  q: "bQ",
  k: "bK",
  P: "wP",
  B: "wB",
  N: "wN",
  R: "wR",
  Q: "wQ",
  K: "wK",
};

export const getLineEvalLabel = (
  line: Pick<LineEval, "cp" | "mate">
): string => {
  if (line.cp !== undefined) {
    return `${line.cp > 0 ? "+" : ""}${(line.cp / 100).toFixed(2)}`;
  }

  if (line.mate) {
    return `${line.mate > 0 ? "+" : "-"}M${Math.abs(line.mate)}`;
  }

  return "?";
};

export const getCommentDisplay = (raw: string): string =>
  raw.replace(/\[%[^\]]+\]/g, "").trim();

const CAL_COLORS: Record<string, string> = {
  R: "#f73c3c",
  G: "#22ac38",
  B: "#3c8cff",
  Y: "#f0c040",
  O: "#f07830",
};

export const getCommentArrows = (
  comment: string
): [string, string, string][] => {
  const results: [string, string, string][] = [];
  const re = /\[%cal ([^\]]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(comment)) !== null) {
    for (const entry of m[1].split(",")) {
      const colorCode = entry[0]?.toUpperCase();
      const from = entry.slice(1, 3);
      const to = entry.slice(3, 5);
      const color = CAL_COLORS[colorCode];
      if (color && /^[a-h][1-8]$/.test(from) && /^[a-h][1-8]$/.test(to)) {
        results.push([from, to, color]);
      }
    }
  }
  return results;
};

export const getCommentClock = (comment: string): string | undefined => {
  const m = comment.match(/\[%clk (\d+):(\d{2}):(\d{2})\]/);
  if (!m) return undefined;
  const h = parseInt(m[1], 10);
  const mi = parseInt(m[2], 10);
  if (h > 0) return `${h}:${m[2]}:${m[3]}`;
  if (mi > 0) return `${mi}:${m[3]}`;
  return `0:${m[3]}`;
};

export const setCommentAtMoveIdx = (
  game: Chess,
  moveIdx: number,
  userText: string
): Chess => {
  const verboseHistory = game.history({ verbose: true });
  const headers = game.getHeaders();
  const commentMap = new Map(game.getComments().map((c) => [c.fen, c.comment]));

  const newGame = new Chess();
  Object.entries(headers).forEach(([k, v]) => {
    if (v) newGame.setHeader(k, v);
  });

  for (let i = 0; i < verboseHistory.length; i++) {
    const move = verboseHistory[i];
    newGame.move({ from: move.from, to: move.to, promotion: move.promotion });

    const existingRaw = commentMap.get(move.after) ?? "";
    let c: string;
    if (i + 1 === moveIdx) {
      const annotations = (existingRaw.match(/\[%[^\]]+\]/g) ?? []).join(" ");
      c = [userText.trim(), annotations].filter(Boolean).join(" ");
    } else {
      c = existingRaw;
    }
    if (c) newGame.setComment(c);
  }

  return newGame;
};

export const formatUciPv = (fen: string, uciMoves: string[]): string[] => {
  const castlingRights = fen.split(" ")[2];

  let canWhiteCastleKingSide = castlingRights.includes("K");
  let canWhiteCastleQueenSide = castlingRights.includes("Q");
  let canBlackCastleKingSide = castlingRights.includes("k");
  let canBlackCastleQueenSide = castlingRights.includes("q");

  return uciMoves.map((uci) => {
    if (uci === "e1h1" && canWhiteCastleKingSide) {
      canWhiteCastleKingSide = false;
      return "e1g1";
    }
    if (uci === "e1a1" && canWhiteCastleQueenSide) {
      canWhiteCastleQueenSide = false;
      return "e1c1";
    }

    if (uci === "e8h8" && canBlackCastleKingSide) {
      canBlackCastleKingSide = false;
      return "e8g8";
    }
    if (uci === "e8a8" && canBlackCastleQueenSide) {
      canBlackCastleQueenSide = false;
      return "e8c8";
    }

    return uci;
  });
};
