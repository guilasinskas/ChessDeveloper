import { useEffect, useState } from "react";

const getInitialWidth = (): number => {
  if (typeof document === "undefined") return 500;
  const main = document.querySelector("main") as HTMLElement | null;
  if (main?.clientWidth) return main.clientWidth;
  const fallback = document.querySelector(".MuiGrid2-root") as HTMLElement | null;
  return fallback?.clientWidth ?? 500;
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
