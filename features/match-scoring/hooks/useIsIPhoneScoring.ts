"use client";

import { useEffect, useState } from "react";
import { isIPhoneDevice } from "@/utils/fullscreen";

/** True only on iPhone/iPod — never iPad or desktop. */
export function useIsIPhoneScoring(): boolean {
  const [isIPhone, setIsIPhone] = useState(false);

  useEffect(() => {
    setIsIPhone(isIPhoneDevice());
  }, []);

  return isIPhone;
}
