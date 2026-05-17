import { Box, Grid2 as Grid } from "@mui/material";
import { Chessboard } from "react-chessboard";
import { PrimitiveAtom, atom, useAtomValue, useSetAtom } from "jotai";
import {
  Arrow,
  CustomPieces,
  CustomSquareRenderer,
  Piece,
  PromotionPieceOption,
  Square,
} from "react-chessboard/dist/chessboard/types";
import { useChessActions } from "@/hooks/useChessActions";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Color, MoveClassification } from "@/types/enums";
import { Chess, Move } from "chess.js";
import { getSquareRenderer } from "./squareRenderer";
import { CurrentPosition } from "@/types/eval";
import EvaluationBar from "./evaluationBar";
import { CLASSIFICATION_COLORS } from "@/constants";
import { Player } from "@/types/game";
import PlayerHeader from "./playerHeader";
import { boardHueAtom, pieceSetAtom } from "./states";
import { LAYOUT } from "@/hooks/useScreenSize";
import tinycolor from "tinycolor2";

export interface Props {
  id: string;
  canPlay?: Color | boolean;
  gameAtom: PrimitiveAtom<Chess>;
  boardSize?: number;
  whitePlayer: Player;
  blackPlayer: Player;
  boardOrientation?: Color;
  currentPositionAtom?: PrimitiveAtom<CurrentPosition>;
  showBestMoveArrow?: boolean;
  showPlayerMoveIconAtom?: PrimitiveAtom<boolean>;
  showEngineAtom?: PrimitiveAtom<boolean>;
  showEvaluationBar?: boolean;
  annotationArrows?: Arrow[];
  onPlayMove?: (params: {
    from: string;
    to: string;
    promotion?: string;
  }) => Move | null;
}

const defaultCurrentPositionAtom = atom<CurrentPosition>({});

export default function Board({
  id: boardId,
  canPlay,
  gameAtom,
  boardSize,
  whitePlayer,
  blackPlayer,
  boardOrientation = Color.White,
  currentPositionAtom = defaultCurrentPositionAtom,
  showBestMoveArrow = false,
  showPlayerMoveIconAtom,
  showEngineAtom,
  showEvaluationBar = false,
  annotationArrows,
  onPlayMove,
}: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const game = useAtomValue(gameAtom);
  const { playMove } = useChessActions(gameAtom);
  const clickedSquaresAtom = useMemo(() => atom<Square[]>([]), []);
  const setClickedSquares = useSetAtom(clickedSquaresAtom);
  const playableSquaresAtom = useMemo(() => atom<Square[]>([]), []);
  const setPlayableSquares = useSetAtom(playableSquaresAtom);
  const position = useAtomValue(currentPositionAtom);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [moveClickFrom, setMoveClickFrom] = useState<Square | null>(null);
  const [moveClickTo, setMoveClickTo] = useState<Square | null>(null);
  const pieceSet = useAtomValue(pieceSetAtom);
  const boardHue = useAtomValue(boardHueAtom);
  const playBoardMove = onPlayMove ?? playMove;

  const gameFen = game.fen();

  useEffect(() => {
    setClickedSquares([]);
  }, [gameFen, setClickedSquares]);

  const isPiecePlayable = useCallback(
    ({ piece }: { piece: string }): boolean => {
      if (game.isGameOver() || !canPlay) return false;
      if (canPlay === true || canPlay === piece[0]) return true;
      return false;
    },
    [canPlay, game]
  );

  const onPieceDrop = useCallback(
    (source: Square, target: Square, piece: string): boolean => {
      if (!isPiecePlayable({ piece })) return false;

      const result = playBoardMove({
        from: source,
        to: target,
        promotion: piece[1]?.toLowerCase() ?? "q",
      });

      return !!result;
    },
    [isPiecePlayable, playBoardMove]
  );

  const resetMoveClick = useCallback(
    (square?: Square | null) => {
      setMoveClickFrom(square ?? null);
      setMoveClickTo(null);
      setShowPromotionDialog(false);
      if (square) {
        const moves = game.moves({ square, verbose: true });
        setPlayableSquares(moves.map((m) => m.to));
      } else {
        setPlayableSquares([]);
      }
    },
    [setMoveClickFrom, setMoveClickTo, setPlayableSquares, game]
  );

  const handleSquareLeftClick = useCallback(
    (square: Square, piece?: string) => {
      setClickedSquares([]);

      if (!moveClickFrom) {
        if (piece && !isPiecePlayable({ piece })) return;
        resetMoveClick(square);
        return;
      }

      const validMoves = game.moves({ square: moveClickFrom, verbose: true });
      const move = validMoves.find((m) => m.to === square);

      if (!move) {
        resetMoveClick(square);
        return;
      }

      setMoveClickTo(square);

      if (
        move.piece === "p" &&
        ((move.color === "w" && square[1] === "8") ||
          (move.color === "b" && square[1] === "1"))
      ) {
        setShowPromotionDialog(true);
        return;
      }

      const result = playBoardMove({
        from: moveClickFrom,
        to: square,
      });

      resetMoveClick(result ? undefined : square);
    },
    [
      game,
      isPiecePlayable,
      moveClickFrom,
      playBoardMove,
      resetMoveClick,
      setClickedSquares,
    ]
  );

  const handleSquareRightClick = useCallback(
    (square: Square) => {
      setClickedSquares((prev) =>
        prev.includes(square)
          ? prev.filter((s) => s !== square)
          : [...prev, square]
      );
    },
    [setClickedSquares]
  );

  const handlePieceDragBegin = useCallback(
    (_: string, square: Square) => {
      resetMoveClick(square);
    },
    [resetMoveClick]
  );

  const handlePieceDragEnd = useCallback(() => {
    resetMoveClick();
  }, [resetMoveClick]);

  const onPromotionPieceSelect = useCallback(
    (piece?: PromotionPieceOption, from?: Square, to?: Square) => {
      if (!piece) return false;
      const promotionPiece = piece[1]?.toLowerCase() ?? "q";

      if (moveClickFrom && moveClickTo) {
        const result = playBoardMove({
          from: moveClickFrom,
          to: moveClickTo,
          promotion: promotionPiece,
        });
        resetMoveClick();
        return !!result;
      }

      if (from && to) {
        const result = playBoardMove({
          from,
          to,
          promotion: promotionPiece,
        });
        resetMoveClick();
        return !!result;
      }

      resetMoveClick(moveClickFrom);
      return false;
    },
    [moveClickFrom, moveClickTo, playBoardMove, resetMoveClick]
  );

  const engineArrow: Arrow[] = useMemo(() => {
    const bestMove = position?.lastEval?.bestMove;
    const moveClassification = position?.eval?.moveClassification;

    if (
      bestMove &&
      showBestMoveArrow &&
      moveClassification !== MoveClassification.Best &&
      moveClassification !== MoveClassification.Opening &&
      moveClassification !== MoveClassification.Forced &&
      moveClassification !== MoveClassification.Perfect
    ) {
      return [
        [
          bestMove.slice(0, 2),
          bestMove.slice(2, 4),
          tinycolor(CLASSIFICATION_COLORS[MoveClassification.Best])
            .spin(-boardHue)
            .toHexString(),
        ] as Arrow,
      ];
    }

    return [];
  }, [position, showBestMoveArrow, boardHue]);

  const customArrows = useMemo(
    () => [...(annotationArrows ?? []), ...engineArrow],
    [annotationArrows, engineArrow]
  );

  const SquareRenderer: CustomSquareRenderer = useMemo(() => {
    return getSquareRenderer({
      currentPositionAtom: currentPositionAtom,
      clickedSquaresAtom,
      playableSquaresAtom,
      showPlayerMoveIconAtom,
      showEngineAtom,
      boardSize: boardSize || 400,
    });
  }, [
    currentPositionAtom,
    clickedSquaresAtom,
    playableSquaresAtom,
    showPlayerMoveIconAtom,
    showEngineAtom,
    boardSize,
  ]);

  const customPieces = useMemo(
    () =>
      PIECE_CODES.reduce<CustomPieces>((acc, piece) => {
        acc[piece] = ({ squareWidth }) => (
          <Box
            width={squareWidth}
            height={squareWidth}
            sx={{
              backgroundImage: `url(/piece/${pieceSet}/${piece}.svg)`,
              backgroundSize: "contain",
            }}
          />
        );

        return acc;
      }, {}),
    [pieceSet]
  );

  const customBoardStyle = useMemo(() => {
    const commonBoardStyle = {
      borderRadius: "12px",
      boxShadow: "none",
    };

    if (boardHue) {
      return {
        ...commonBoardStyle,
        filter: `hue-rotate(${boardHue}deg)`,
      };
    }

    return commonBoardStyle;
  }, [boardHue]);

  // boardSize is the chessboard SQUARES area, not the whole column. The
  // eval bar matches the chessboard exactly (same height), and the inner
  // column width is also boardSize so the chessboard sizes itself square.
  return (
    <Grid
      container
      justifyContent="center"
      alignItems="flex-start"
      wrap="nowrap"
      sx={{
        flexShrink: 0,
        flexGrow: 0,
        // Outer container is just wide enough for eval bar + chessboard.
        // No fixed height — content (headers + board) drives it.
      }}
    >
      {showEvaluationBar && (
        <Box
          sx={{
            // Eval bar aligned to the CHESSBOARD vertically — top-padding
            // skips the player-header strip + rowGap so the bar starts at
            // the same Y as the squares, not at the top of the column.
            pt: `${LAYOUT.playerHeaderHeight + LAYOUT.boardRowGap}px`,
            display: "flex",
            flexDirection: "column",
            alignSelf: "flex-start",
          }}
        >
          <EvaluationBar
            height={boardSize || 400}
            boardOrientation={boardOrientation}
            currentPositionAtom={currentPositionAtom}
          />
        </Box>
      )}

      <Grid
        container
        rowGap={1.5}
        justifyContent="center"
        alignItems="center"
        paddingLeft={{ xs: 0.5, sm: showEvaluationBar ? 1 : 0 }}
        sx={{ width: boardSize, flexShrink: 0 }}
      >
        <PlayerHeader
          color={boardOrientation === Color.White ? Color.Black : Color.White}
          gameAtom={gameAtom}
          player={boardOrientation === Color.White ? blackPlayer : whitePlayer}
        />

        {/* Outer "frame" matches the Stitch reference: surface-container-highest
         * tint + 24px rounded corners + soft padding around the inner board.
         * The padding lives on THIS wrapper, not on the chessboard's immediate
         * parent — react-chessboard reads its container's bounding rect for
         * hit detection, so any inset between the wrapper and the actual
         * <Chessboard /> div would make piece-drag positions drift. */}
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          size={12}
          sx={{
            borderRadius: "24px",
            backgroundColor: "var(--cc-surface-container-highest)",
            boxShadow: "var(--cc-shadow-ambient)",
            padding: "8px",
          }}
        >
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            ref={boardRef}
            size={12}
            sx={{
              borderRadius: "12px",
              border: "1px solid var(--cc-outline-variant)",
              overflow: "hidden",
            }}
          >
            <Chessboard
              id={`${boardId}-${canPlay}`}
              position={gameFen}
              onPieceDrop={onPieceDrop}
              boardOrientation={
                boardOrientation === Color.White ? "white" : "black"
              }
              customBoardStyle={customBoardStyle}
              customLightSquareStyle={{ backgroundColor: "#e8e4d7" }}
              customDarkSquareStyle={{ backgroundColor: "#55624d" }}
              customArrows={customArrows}
              isDraggablePiece={isPiecePlayable}
              customSquare={SquareRenderer}
              onSquareClick={handleSquareLeftClick}
              onSquareRightClick={handleSquareRightClick}
              onPieceDragBegin={handlePieceDragBegin}
              onPieceDragEnd={handlePieceDragEnd}
              onPromotionPieceSelect={onPromotionPieceSelect}
              showPromotionDialog={showPromotionDialog}
              promotionToSquare={moveClickTo}
              animationDuration={200}
              customPieces={customPieces}
            />
          </Grid>
        </Grid>

        <PlayerHeader
          color={boardOrientation}
          gameAtom={gameAtom}
          player={boardOrientation === Color.White ? whitePlayer : blackPlayer}
        />
      </Grid>
    </Grid>
  );
}

export const PIECE_CODES = [
  "wP",
  "wB",
  "wN",
  "wR",
  "wQ",
  "wK",
  "bP",
  "bB",
  "bN",
  "bR",
  "bQ",
  "bK",
] as const satisfies Piece[];
