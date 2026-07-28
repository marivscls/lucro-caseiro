import { act, renderHook } from "@testing-library/react";
import { Platform } from "react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppAlert } from "../../shared/components/alert-store";
import { useSubscription } from "./use-subscription";

const mocks = vi.hoisted(() => ({
  fetchProfile: vi.fn(),
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
  setQueryData: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mocks.invalidateQueries,
    setQueryData: mocks.setQueryData,
  }),
}));

vi.mock("../../shared/hooks/use-auth", () => ({
  useAuth: () => ({ token: "token", userId: "user-id" }),
}));

vi.mock("./api", () => ({
  fetchProfile: mocks.fetchProfile,
  syncPlan: vi.fn(),
}));

describe("useSubscription restore outside Android", () => {
  beforeEach(() => {
    Object.assign(Platform, { OS: "web" });
    mocks.fetchProfile.mockReset();
    mocks.invalidateQueries.mockClear();
    mocks.setQueryData.mockClear();
    useAppAlert.getState().hide();
  });

  it("restores an active subscription linked to the account", async () => {
    const profile = {
      plan: "essential",
      planExpiresAt: null,
    };
    mocks.fetchProfile.mockResolvedValue(profile);
    const { result } = renderHook(() => useSubscription());

    await act(async () => {
      await result.current.restore();
    });

    expect(mocks.fetchProfile).toHaveBeenCalledWith("token");
    expect(mocks.setQueryData).toHaveBeenCalledWith(
      ["subscription", "profile"],
      profile,
    );
    expect(useAppAlert.getState().options?.title).toBe("Restaurado!");
  });

  it("reports when the account has no active subscription", async () => {
    mocks.fetchProfile.mockResolvedValue({
      plan: "free",
      planExpiresAt: null,
    });
    const { result } = renderHook(() => useSubscription());

    await act(async () => {
      await result.current.restore();
    });

    expect(useAppAlert.getState().options).toMatchObject({
      title: "Nenhuma assinatura encontrada",
      message: "Não encontramos uma assinatura ativa vinculada a esta conta.",
    });
  });
});
