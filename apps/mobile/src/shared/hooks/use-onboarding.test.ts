import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthError, User } from "@supabase/supabase-js";

import { supabase } from "../utils/supabase";
import { useOnboarding } from "./use-onboarding";

afterEach(() => {
  vi.restoreAllMocks();
  useOnboarding.setState({
    completed: false,
    completedUserIds: [],
    pendingUserIds: [],
    gettingStartedStartedUserIds: [],
    gettingStartedCompletedUserIds: [],
  });
});

describe("getting started", () => {
  it("guarda inicio e conclusao por conta sem duplicar", () => {
    const state = useOnboarding.getState();

    state.startGettingStarted("user-1");
    useOnboarding.getState().startGettingStarted("user-1");
    useOnboarding.getState().completeGettingStarted("user-1");

    expect(useOnboarding.getState()).toMatchObject({
      gettingStartedStartedUserIds: ["user-1"],
      gettingStartedCompletedUserIds: ["user-1"],
    });
  });

  it("preserva o progresso ao encerrar a sessao", () => {
    useOnboarding.setState({
      gettingStartedStartedUserIds: ["user-1"],
      gettingStartedCompletedUserIds: ["user-2"],
    });

    useOnboarding.getState().reset();

    expect(useOnboarding.getState()).toMatchObject({
      gettingStartedStartedUserIds: ["user-1"],
      gettingStartedCompletedUserIds: ["user-2"],
    });
  });
});

describe("completeOnboarding", () => {
  it("persiste a conclusao na conta antes de concluir localmente", async () => {
    const updateUser = vi.spyOn(supabase.auth, "updateUser").mockResolvedValue({
      data: { user: { id: "user-1" } as User },
      error: null,
    });
    useOnboarding.setState({ pendingUserIds: ["user-1"] });

    await useOnboarding.getState().completeOnboarding("user-1");

    expect(updateUser).toHaveBeenCalledWith({
      data: { onboarding_completed: true },
    });
    expect(useOnboarding.getState()).toMatchObject({
      completed: true,
      completedUserIds: ["user-1"],
      pendingUserIds: [],
    });
  });

  it("nao conclui localmente quando a persistencia falha", async () => {
    vi.spyOn(supabase.auth, "updateUser").mockResolvedValue({
      data: { user: null },
      error: new Error("network") as AuthError,
    });

    await expect(useOnboarding.getState().completeOnboarding("user-1")).rejects.toThrow(
      "network",
    );
    expect(useOnboarding.getState().completed).toBe(false);
  });
});
