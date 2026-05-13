import { useEffect, useState } from "react";
import { SIDEBAR_WIDTH } from "@/sections/layout/SideBar";

/*
 * Board-sizing source of truth.
 *
 * The board dimensions are derived from `screenSize` (see BoardContainer).
 * Anything that can drift while a game is being played — captured-piece rows
 * growing, scrollbars appearing, engine lines wrapping — must NOT feed back
 * into this hook, otherwise the board flickers on every move.
 *
 * Returns raw viewport dimensions. The caller is responsible for subtracting
 * its own chrome (page padding, navbar, panel width) using the LAYOUT
 * constants exported below — that keeps the math explicit and auditable
 * instead of buried inside a magic `-60`.
 */

// Layout chrome — single source of truth for every dimension the board has
// to fight for. Values match what's actually rendered in pages/index.tsx and
// layout/index.tsx; bump them here and the board recomputes accordingly.
export const LAYOUT = {
  navbarHeight: 56,         // top NavBar shown on xs/sm only
  sidebarWidth: SIDEBAR_WIDTH, // vertical SideBar shown on md+
  pagePaddingY: 8,          // py: 1 in MUI = 8px each side
  pagePaddingX: 12,         // px: 1.5 = 12px each side
  boardPanelGap: 16,        // gap: 2 between board and panel
  panelMinWidth: 360,       // analysis panel needs at least this much width
  // Vertical budget reserved by everything ABOVE / BELOW the chessboard
  // squares (per side) so the board never pushes the page past 100dvh.
  // playerHeader = 48px avatar + 2.5*8px vertical padding + 2px border + a
  // 1.1rem (~18px) row reserved for captured pieces inside the header.
  playerHeaderHeight: 84,
  // rowGap (MUI 1.5 = 12px) between player header and board, top + bottom.
  boardRowGap: 12,
  // Evaluation bar slot — pill width (2rem at sm) + paddingLeft (1 = 8px).
  evalBarWidth: 40,
  // Sticky page-title bar height (analysis/database/stats/openings share this).
  titleBarHeight: 64,
  // breakpoints (kept in sync with the MUI theme)
  bpSidebar: 900,           // md — sidebar appears
  bpSideBySide: 1200,       // lg — board and panel sit side-by-side
} as const;

const getViewportWidth = (): number =>
  typeof window === "undefined" ? 500 : window.innerWidth;

const getViewportHeight = (): number =>
  typeof window === "undefined" ? 500 : window.innerHeight;

export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState(() => ({
    width: getViewportWidth(),
    height: getViewportHeight(),
  }));

  useEffect(() => {
    const handleResize = () => {
      const nextWidth = getViewportWidth();
      const nextHeight = getViewportHeight();
      setScreenSize((prev) =>
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight }
      );
    };

    window.addEventListener("resize", handleResize);
    // Re-measure once after mount in case the viewport changed between SSR
    // and hydration (mobile address bar collapse, etc.).
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenSize;
};
