import { useProfile } from "../../features/subscription/hooks";

/**
 * Centralized hook to determine if ads should be shown.
 * Returns true only for free plan users.
 */
export function useShowAds(): boolean {
  const { data: profile } = useProfile();
  return profile?.plan !== "premium";
}
