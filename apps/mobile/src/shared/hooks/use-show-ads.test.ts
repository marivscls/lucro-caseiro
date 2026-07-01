import { describe, expect, it, vi, beforeEach } from "vitest";

import { useShowAds } from "./use-show-ads";

const mockUseProfile = vi.fn();

vi.mock("../../features/subscription/hooks", () => ({
  isProfilePremiumActive: (
    profile?: { plan?: string; planExpiresAt?: string | null } | null,
  ) => {
    if (profile?.plan !== "premium") return false;
    if (!profile.planExpiresAt) return true;
    return new Date(profile.planExpiresAt) > new Date();
  },
  useProfile: () => mockUseProfile(),
}));

describe("useShowAds", () => {
  beforeEach(() => {
    mockUseProfile.mockReset();
  });

  it("returns true when profile plan is free", () => {
    mockUseProfile.mockReturnValue({ data: { plan: "free" } });
    expect(useShowAds()).toBe(true);
  });

  it("returns false when profile plan is premium", () => {
    mockUseProfile.mockReturnValue({ data: { plan: "premium" } });
    expect(useShowAds()).toBe(false);
  });

  it("returns false when profile is undefined (loading)", () => {
    mockUseProfile.mockReturnValue({ data: undefined });
    expect(useShowAds()).toBe(false);
  });

  it("returns false when profile is null (error)", () => {
    mockUseProfile.mockReturnValue({ data: null });
    expect(useShowAds()).toBe(false);
  });
});
