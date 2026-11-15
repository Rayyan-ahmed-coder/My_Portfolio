import React, { useEffect, useRef } from "react";
import { listen, rafThrottle } from "../core/utilities.js";

export default function ScrollProgressIndicator(): React.JSX.Element {
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    let documentHeight = 0;
    let viewportHeight = 0;
    let maxScrollRange = 0;

    const measureLayoutMetrics = (): void => {
      viewportHeight = window.innerHeight;
      documentHeight = document.documentElement.scrollHeight;
      maxScrollRange = documentHeight - viewportHeight;
    };

    measureLayoutMetrics();

    const calculateScrollProgress = (): void => {
      const currentScrollTop = window.scrollY || document.documentElement.scrollTop;
      const progress = maxScrollRange > 0 ? Math.min(1, Math.max(0, currentScrollTop / maxScrollRange)) : 0;
      indicatorRef.current?.style.setProperty("--scroll-progress", String(progress));
    };

    const throttledScroll = rafThrottle(calculateScrollProgress);
    const debouncedResize = (): void => {
      measureLayoutMetrics();
      calculateScrollProgress();
    };

    calculateScrollProgress();
    const unbindScroll = listen(window, "scroll", throttledScroll);
    const unbindResize = listen(window, "resize", debouncedResize);

    return () => {
      unbindScroll();
      unbindResize();
      throttledScroll.cancel();
    };
  }, []);

  return <div ref={indicatorRef} className="scroll-progress-indicator" aria-hidden="true" />;
}
