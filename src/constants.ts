import { EngineName, MoveClassification } from "./types/enums";

/*
 * Zenith Wellness design tokens.
 *
 * Every value is a reference to a CSS variable defined in src/styles/design.css.
 * Components import `CC` and receive a `var(--cc-*)` string — themed at runtime
 * by toggling the `data-theme` attribute on the html element. To change colors,
 * spacing, radius, motion or typography, edit design.css; nothing else needs to
 * be touched (except RAW_TOKENS below if you change a palette color used by
 * MUI's createTheme).
 */

export const MAIN_THEME_COLOR = "#55624d";
export const LINEAR_PROGRESS_BAR_COLOR = "var(--cc-primary)";

/*
 * RAW_TOKENS — literal hex mirror of the values in src/styles/design.css.
 *
 * Used ONLY by MUI's createTheme palette, which rejects var(--*) strings
 * because it runs contrast calculations on them at theme creation time.
 * Everything user-facing keeps reading the CSS variables via the CC.* tokens
 * below, so a single edit in design.css still re-themes the whole UI.
 *
 * Keep this object in sync with the :root values in design.css.
 */
export const RAW_TOKENS = {
  // Zenith wellness palette — light mode is default
  light: {
    bg0: "#ffffff",
    bg1: "#f8faf3",
    bg2: "#f2f4ed",
    bg3: "#ecefe8",
    bg4: "#e7e9e2",
    bg5: "#e1e3dc",
    text: "#191c18",
    textSub: "#444841",
    textMuted: "#757870",
    primary: "#55624d", // sage
    primaryContrast: "#ffffff",
    border: "#c5c8be",
    error: "#ba1a1a",
    gold: "#fed7d2", // peach (legacy "gold" slot — affective marker)
    green: "#55624d", // sage IS the green
  },
  dark: {
    bg0: "#0b0e09",
    bg1: "#11140f",
    bg2: "#191c17",
    bg3: "#1d201b",
    bg4: "#272b25",
    bg5: "#323630",
    text: "#e1e3dc",
    textSub: "#c5c8be",
    textMuted: "#8f9389",
    primary: "#bdcbb2", // sage claro (inverse primary)
    primaryContrast: "#273420",
    border: "#444841",
    error: "#ffb4ab",
    gold: "#5b403d",
    green: "#bdcbb2",
  },
} as const;

export const CC = {
  // Surfaces
  bg0: "var(--cc-bg0)",
  bg1: "var(--cc-bg1)",
  bg2: "var(--cc-bg2)",
  bg3: "var(--cc-bg3)",
  bg4: "var(--cc-bg4)",
  bg5: "var(--cc-bg5)",

  // Accent — value not hue. Resolves to bone on dark, near-black on light.
  primary: "var(--cc-primary)",
  primaryDark: "var(--cc-primary-dark)",
  primaryContrast: "var(--cc-primary-contrast)",
  primaryMuted: "var(--cc-primary-muted)",
  primarySubtle: "var(--cc-primary-subtle)",

  // Semantic
  green: "var(--cc-green)",
  greenHover: "var(--cc-green-hover)",
  greenMuted: "var(--cc-green-muted)",
  greenSubtle: "var(--cc-green-subtle)",
  gold: "var(--cc-gold)",
  error: "var(--cc-error)",

  // Text
  text: "var(--cc-text)",
  textSub: "var(--cc-text-sub)",
  textMuted: "var(--cc-text-muted)",

  // Borders
  border: "var(--cc-border)",
  borderHover: "var(--cc-border-hover)",

  // TopAppBar / SideBar specific
  navBg: "var(--cc-nav-bg)",
  navBorder: "var(--cc-nav-border)",

  // Legacy light-mode aliases (resolve via data-theme on html)
  lBg0: "var(--cc-bg0)",
  lBg1: "var(--cc-bg2)",
  lBg2: "var(--cc-bg3)",
  lBg3: "var(--cc-bg4)",
  lText: "var(--cc-text)",
  lTextSub: "var(--cc-text-sub)",
  lBorder: "var(--cc-border)",

  // Board squares
  boardLight: "var(--cc-board-light)",
  boardDark: "var(--cc-board-dark)",

  // Typography stacks
  fontSans: "var(--cc-font-sans)",
  fontSerif: "var(--cc-font-serif)",
  fontMono: "var(--cc-font-mono)",

  // Shape
  radiusXs: "var(--cc-radius-xs)",
  radiusSm: "var(--cc-radius-sm)",
  radiusMd: "var(--cc-radius-md)",
  radiusLg: "var(--cc-radius-lg)",

  // Motion
  motionEasing: "var(--cc-motion-easing)",
  motionDurationFast: "var(--cc-motion-duration-fast)",
  motionDuration: "var(--cc-motion-duration)",
  motionDurationSlow: "var(--cc-motion-duration-slow)",

  // Elevation
  shadowCard: "var(--cc-shadow-card)",
  shadowMenu: "var(--cc-shadow-menu)",
  shadowDialog: "var(--cc-shadow-dialog)",
} as const;

export const CLASSIFICATION_COLORS: Record<MoveClassification, string> = {
  [MoveClassification.Opening]: "#dbac86",
  [MoveClassification.Forced]: "#dbac86",
  [MoveClassification.Splendid]: "#19d4af",
  [MoveClassification.Perfect]: "#3894eb",
  [MoveClassification.Best]: "#22ac38",
  [MoveClassification.Excellent]: "#22ac38",
  [MoveClassification.Okay]: "#74b038",
  [MoveClassification.Inaccuracy]: "#f2be1f",
  [MoveClassification.Mistake]: "#e69f00",
  [MoveClassification.Blunder]: "#df5353",
};

export const DEFAULT_ENGINE: EngineName = EngineName.Stockfish18Lite;
export const STRONGEST_ENGINE: EngineName = EngineName.Stockfish18;

export const ENGINE_LABELS: Record<
  EngineName,
  { small: string; full: string; sizeMb: number }
> = {
  [EngineName.Stockfish18]: {
    full: "Stockfish 18 (108MB)",
    small: "Stockfish 18",
    sizeMb: 108,
  },
  [EngineName.Stockfish18Lite]: {
    full: "Stockfish 18 Lite (7MB)",
    small: "Stockfish 18 Lite",
    sizeMb: 7,
  },
  [EngineName.Stockfish11]: {
    full: "Stockfish 11 (HCE)",
    small: "Stockfish 11",
    sizeMb: 2,
  },
};

export const PIECE_SETS = [
  "alpha",
  "anarcandy",
  "caliente",
  "california",
  "cardinal",
  "cburnett",
  "celtic",
  "chess7",
  "chessnut",
  "chicago",
  "companion",
  "cooke",
  "dubrovny",
  "fantasy",
  "firi",
  "fresca",
  "gioco",
  "governor",
  "horsey",
  "icpieces",
  "iowa",
  "kiwen-suwi",
  "kosal",
  "leipzig",
  "letter",
  "maestro",
  "merida",
  "monarchy",
  "mpchess",
  "oslo",
  "pirouetti",
  "pixel",
  "reillycraig",
  "rhosgfx",
  "riohacha",
  "shapes",
  "spatial",
  "staunty",
  "symmetric",
  "tatiana",
  "xkcd",
] as const satisfies string[];
