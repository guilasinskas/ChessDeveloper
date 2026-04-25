import { useEffect, useState } from "react";

const getInitialWidth = (): number => {
  if (typeof window === "undefined") return 500;
  const main = document.querySelector("main") as HTMLElement | null;
  if (main?.clientWidth) return main.clientWidth;
  const fallback = document.querySelector(".MuiGrid2-root") as HTMLElement | null;
  if (fallback?.clientWidth) return fallback.clientWidth;
  // CSS may not be loaded yet — use window.innerWidth as a better fallback
  // than a hardcoded 500 to avoid a large layout jump on first paint
  return window.innerWidth;
};

const getInitialHeight = (): number =>
  typeof window !== "undefined" ? window.innerHeight - 60 : 500;

export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState(() => ({
    width: getInitialWidth(),
    height: getInitialHeight(),
  }));

  useEffect(() => {
    const target =
      (document.querySelector("main") as HTMLElement | null) ??
      (document.querySelector(".MuiGrid2-root") as HTMLElement | null);
    if (!target) return;

    let frame = 0;
    const observer = new ResizeObserver(() => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nextWidth = target.clientWidth;
        setScreenSize((prev) =>
          prev.width === nextWidth ? prev : { ...prev, width: nextWidth }
        );
      });
    });
    observer.observe(target);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const nextHeight = window.innerHeight - 60;
      setScreenSize((prev) =>
        prev.height === nextHeight ? prev : { ...prev, height: nextHeight }
      );
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenSize;
};
