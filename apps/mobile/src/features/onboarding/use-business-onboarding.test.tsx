import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBusinessOnboarding } from "./use-business-onboarding";
import { emptyBusinessProfile } from "./profile-data";

const mocks = vi.hoisted(() => ({
  userId: "a",
  getUser: vi.fn(),
  updateUser: vi.fn(),
  updateProfile: vi.fn(),
  setOnboarding: vi.fn(),
  setAuth: vi.fn(),
}));
vi.mock("../../shared/hooks/use-auth", () => ({
  useAuth: Object.assign(
    (selector: (value: { userId: string }) => unknown) =>
      selector({ userId: mocks.userId }),
    { getState: () => ({ userId: mocks.userId }), setState: mocks.setAuth },
  ),
}));
vi.mock("../../shared/hooks/use-onboarding", () => ({
  useOnboarding: { setState: mocks.setOnboarding },
}));
vi.mock("../../shared/utils/supabase", () => ({
  supabase: { auth: { getUser: mocks.getUser, updateUser: mocks.updateUser } },
}));
vi.mock("../subscription/hooks", () => ({
  useProfile: () => ({
    data: {
      name: mocks.userId === "a" ? "Ana" : "Bia",
      businessName: "",
      businessType: null,
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useUpdateProfile: () => ({ mutateAsync: mocks.updateProfile }),
}));

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return renderHook(() => useBusinessOnboarding(), {
    wrapper: ({ children }: React.PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}
const answers = {
  ...emptyBusinessProfile,
  name: "Ana",
  segment: "food",
  stage: "starting",
  goal: "price",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.userId = "a";
  mocks.getUser.mockImplementation(() =>
    Promise.resolve({
      data: { user: { id: mocks.userId, user_metadata: {} } },
      error: null,
    }),
  );
  mocks.updateProfile.mockResolvedValue({});
  mocks.updateUser.mockResolvedValue({ error: null });
});

describe("sincronização do onboarding", () => {
  it("recupera a dispensa salva na conta sem depender da memória local", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "a",
          user_metadata: { business_onboarding: { version: 1, status: "dismissed" } },
        },
      },
      error: null,
    });
    const hook = setup();
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(hook.result.current.record?.status).toBe("dismissed");
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  it("não mostra as respostas de outra conta ao trocar o usuário", async () => {
    mocks.getUser.mockImplementation(() =>
      Promise.resolve({
        data: {
          user: {
            id: mocks.userId,
            user_metadata:
              mocks.userId === "a"
                ? { business_onboarding: { version: 1, status: "completed", answers } }
                : {},
          },
        },
        error: null,
      }),
    );
    const hook = setup();
    await waitFor(() => expect(hook.result.current.record?.status).toBe("completed"));
    mocks.userId = "b";
    hook.rerender();
    expect(hook.result.current.record).toBeNull();
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(hook.result.current.answers.name).toBe("Bia");
    expect(hook.result.current.answers.goal).toBe("");
  });
  it("mantém o fluxo aberto no erro e só confirma depois da nova tentativa", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    mocks.updateUser.mockResolvedValueOnce({ error: new Error("offline") });
    await act(async () => {
      expect(await hook.result.current.save(answers)).toBe(false);
    });
    expect(hook.result.current.error).toContain("tente novamente");
    expect(mocks.setOnboarding).not.toHaveBeenCalled();
    await act(async () => {
      expect(await hook.result.current.save(answers)).toBe(true);
    });
    expect(hook.result.current.error).toBeNull();
    expect(hook.result.current.record?.status).toBe("completed");
    expect(mocks.setOnboarding).toHaveBeenCalledOnce();
  });
  it("não grava metadata em outra conta quando a sessão muda durante o salvamento", async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    mocks.updateProfile.mockImplementation(() => {
      mocks.userId = "b";
      return Promise.resolve();
    });
    await act(async () => {
      expect(await hook.result.current.save(answers)).toBe(false);
    });
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(mocks.setOnboarding).not.toHaveBeenCalled();
  });
});
