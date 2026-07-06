"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

interface ChartFillContainerProps {
  children: (height: number) => React.ReactNode;
  className?: string;
  minHeight?: number;
}

export function ChartFillContainer({
  children,
  className,
  minHeight = 80,
}: ChartFillContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const update = () => {
      const next = Math.floor(element.getBoundingClientRect().height);
      setHeight((current) => {
        const clamped = Math.max(minHeight, next);
        return current === clamped ? current : clamped;
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, [minHeight]);

  return (
    <div ref={ref} className={cn("stats-chart-fill", className)}>
      {height > 0 ? children(height) : null}
    </div>
  );
}
