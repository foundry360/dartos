"use client";

import { useEffect, useState } from "react";
import { isPhoneLayoutDevice } from "@/utils/fullscreen";

/**
 * @deprecated Prefer {@link useIsPhoneScoring}.
 */
export function useIsIPhoneScoring(): boolean {
  return useIsPhoneScoring();
}

/** True on phone handsets (iPhone + Android phone) for compact layouts / pad scoring. */
export function useIsPhoneScoring(): boolean {
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    setIsPhone(isPhoneLayoutDevice());
  }, []);

  return isPhone;
}
