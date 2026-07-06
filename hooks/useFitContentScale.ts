"use client";

import { useLayoutEffect, useRef, useState } from "react";

interface FitContentScaleMetrics {
  scale: number;
  contentHeight: number;
}

interface FitContentScaleOptions {
  /** When true, scale up past 1.0 to fill extra container height (capped). */
  fill?: boolean;
  maxScale?: number;
}

export function useFitContentScale(
  deps: readonly unknown[] = [],
  options: FitContentScaleOptions = {},
) {
  const { fill = false, maxScale = 1.2 } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<FitContentScaleMetrics>({
    scale: 1,
    contentHeight: 0,
  });

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) {
      return;
    }

    const measure = () => {
      const availableHeight = container.clientHeight;
      const naturalHeight = content.offsetHeight;

      if (availableHeight <= 0 || naturalHeight <= 0) {
        setMetrics({ scale: 1, contentHeight: naturalHeight });
        return;
      }

      const rawScale = availableHeight / naturalHeight;
      const scale = fill
        ? Math.min(maxScale, Math.max(0.5, rawScale))
        : Math.min(1, rawScale);
      setMetrics({ scale, contentHeight: naturalHeight });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(content);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, deps);

  return { containerRef, contentRef, metrics };
}
