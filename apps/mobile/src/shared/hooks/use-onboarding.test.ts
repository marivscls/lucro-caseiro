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
