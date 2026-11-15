import type { UserProfile } from "@lucro-caseiro/contracts";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFeatureGate } from "./use-feature-gate";

const state = vi.hoisted(() => ({
  profile: undefined as Partial<UserProfile> | undefined,
  show: vi.fn(),
}));

vi.mock("../../features/subscription/hooks", () => ({
  useProfile: () => ({ data: state.profile }),
}));
vi.mock("./use-paywall", () => ({
  usePaywall: (select: (value: { show: typeof state.show }) => unknown) =>
    select({ show: state.show }),
}));

function makeSut(plan: string | null, planExpiresAt: string | null = null) {
  state.profile = plan === null ? undefined : { plan: plan as never, planExpiresAt };
  return renderHook(() => useFeatureGate("fiado")).result.current;
}

describe("useFeatureGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no Gratuito trava o fiado e abre o paywall do fiado", () => {
    // Arrange
    const gate = makeSut("free");

    // Act
    const blocked = gate.blockIfLocked();

    // Assert
    expect(gate.locked).toBe(true);
    expect(blocked).toBe(true);
    expect(state.show).toHaveBeenCalledWith("fiado");
  });

  it("no Premium deixa seguir sem paywall", () => {
    const gate = makeSut("professional");

    expect(gate.locked).toBe(false);
    expect(gate.blockIfLocked()).toBe(false);
    expect(state.show).not.toHaveBeenCalled();
  });

  it("volta a travar quando o Premium expira", () => {
    expect(makeSut("essential", "2020-01-01T00:00:00Z").locked).toBe(true);
  });

  it("sem perfil carregado não trava (o backend decide)", () => {
    expect(makeSut(null).locked).toBe(false);
  });
});
