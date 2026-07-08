"use client";

import { useEffect, useRef, useState } from "react";
import { getRecentFormRowCapacity } from "@/features/profile/lib/profile-dashboard";

export function useRecentFormRowCapacity() {
  const rowRef = useRef<HTMLDivElement>(null);
  const [capacity, setCapacity] = useState(6);

  useEffect(() => {
    const node = rowRef.current;
    if (!node) {
      return;
    }

    const updateCapacity = () => {
      setCapacity(getRecentFormRowCapacity(node.clientWidth));
    };

    updateCapacity();

    const observer = new ResizeObserver(updateCapacity);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { rowRef, capacity };
}
