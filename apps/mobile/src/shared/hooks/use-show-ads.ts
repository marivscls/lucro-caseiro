import { isProfilePremiumActive, useProfile } from "../../features/subscription/hooks";
import { isMockMode } from "../mock/mode";

/**
 * Centralized hook to determine if ads should be shown.
 * Returns true only for free plan users.
 */
export function useShowAds(): boolean {
  const { data: profile } = useProfile();
  if (isMockMode) return false;
  return profile ? !isProfilePremiumActive(profile) : false;
}
