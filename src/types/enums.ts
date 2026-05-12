export enum GameOrigin {
  Pgn = "pgn",
  ChessCom = "chesscom",
  Lichess = "lichess",
}

export enum EngineName {
  Stockfish18 = "stockfish_18",
  Stockfish18Lite = "stockfish_18_lite",
  Stockfish11 = "stockfish_11",
}

export enum MoveClassification {
  Blunder = "blunder",
  Mistake = "mistake",
  Inaccuracy = "inaccuracy",
  Okay = "okay",
  Excellent = "excellent",
  Best = "best",
  Forced = "forced",
  Opening = "opening",
  Perfect = "perfect",
  Splendid = "splendid",
}

export enum Color {
  White = "w",
  Black = "b",
}
