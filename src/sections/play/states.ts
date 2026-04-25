import { DEFAULT_ENGINE } from "@/constants";
import { Color, EngineName } from "@/types/enums";
import { CurrentPosition } from "@/types/eval";
import { Chess } from "chess.js";
import { atom } from "jotai";

export const gameAtom = atom(new Chess());
export const gameDataAtom = atom<CurrentPosition>({});
export const playerColorAtom = atom<Color>(Color.White);
export const enginePlayNameAtom = atom<EngineName>(DEFAULT_ENGINE);
export const engineEloAtom = atom(1320);
export const isGameInProgressAtom = atom(false);

export interface TimeControl {
  initial: number;
  increment: number;
}

export const TIME_CONTROLS: { label: string; value: TimeControl | null }[] = [
  { label: "Unlimited", value: null },
  { label: "1+0 Bullet", value: { initial: 60, increment: 0 } },
  { label: "2+1 Bullet", value: { initial: 120, increment: 1 } },
  { label: "3+2 Blitz", value: { initial: 180, increment: 2 } },
  { label: "5+3 Blitz", value: { initial: 300, increment: 3 } },
  { label: "10+0 Rapid", value: { initial: 600, increment: 0 } },
  { label: "15+10 Rapid", value: { initial: 900, increment: 10 } },
];

export const timeControlAtom = atom<TimeControl | null>(null);
export const clockWhiteAtom = atom<number | null>(null);
export const clockBlackAtom = atom<number | null>(null);
