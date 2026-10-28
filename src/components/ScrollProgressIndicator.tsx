import React, { useState, useEffect } from "react";
import { listen, rafThrottle } from "../core/utilities.js";

/**
 * Custom viewport tracking progress strip.
 * Integrates precise scrollbar metric boundary tracking allocations.
 */
export default function ScrollProgressIndicator(): React.JSX.Element {
  const [scrollPercent, setScrollPercent] = useState<number>(0);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    let documentHeight = 0;
    let viewportHeight = 0;
    let maxScrollRange = 0;

    /** Pre-calculates static sizing dimensions to protect CPU runtime overhead. */
    const measureLayoutMetrics = (): void => {
      viewportHeight = window.innerHeight;
      documentHeight = document.documentElement.scrollHeight;
      maxScrollRange = documentHeight - viewportHeight;
    };

    // Initialize layout measurements safely once the visual DOM mounts
    measureLayoutMetrics();

    /** Evaluates scroll depth percentages and updates the component view state. */
    const calculateScrollProgress = (): void => {
      if (maxScrollRange <= 0) return;
      const currentScrollTop = window.scrollY || document.documentElement.scrollTop;
      const rawPercentage = (currentScrollTop / maxScrollRange) * 100;
      const finalPercentage = Math.min(100, Math.max(0, rawPercentage));
      setScrollPercent(finalPercentage);
    };

    // Wrap heavy event callbacks inside our frame rate throttler
    const throttledScroll = rafThrottle(calculateScrollProgress);
    const debouncedResize = (): void => {
      measureLayoutMetrics();
      calculateScrollProgress();
    };

    // Wire up listeners with automated type-safe execution bridges
    const unbindScroll = listen(window, "scroll", throttledScroll);
    const unbindResize = listen(window, "resize", debouncedResize);

    return () => {
      unbindScroll();
      unbindResize();
      throttledScroll.cancel();
    };
  }, []);

  return (
    <div
      className="scroll-progress-indicator"
      style={{
        width: `${scrollPercent}%`,
      }}
      aria-label="Scrolled percentage indicator"
    ></div>
  );
}
