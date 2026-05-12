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
 * Earlier versions of this hook observed `<main>` via ResizeObserver. That
 * meant any reflow inside the page (a chip appearing, a captured-piece row
 * collapsing, the right panel re-measuring) propagated back as a width
 * change and the board re-rendered at a slightly different size. We now
 * ignore the DOM entirely and read `window.innerWidth / innerHeight`
 * directly — these only change on actual viewport resizes (window resize,
 * device rotation, devtools toggle). The sidebar margin is subtracted via
 * the imported constant, not measured.
 */

const VERTICAL_CHROME = 60; // top app bar / page padding allowance

const getViewportWidth = (): number => {
  if (typeof window === "undefined") return 500;
  // Subtract the sidebar margin only on widths large enough to render it
  // (matches the md breakpoint used by the layout). On mobile the sidebar
  // is replaced by a top app bar and main spans the full viewport.
  const hasSidebar = window.innerWidth >= 900;
  return window.innerWidth - (hasSidebar ? SIDEBAR_WIDTH : 0);
};

const getViewportHeight = (): number => {
  if (typeof window === "undefined") return 500;
  return window.innerHeight - VERTICAL_CHROME;
};

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
