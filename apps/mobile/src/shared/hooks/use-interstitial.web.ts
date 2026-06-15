import { useCallback } from "react";

export function useInterstitial() {
  const show = useCallback(() => {}, []);
  return { show };
}
