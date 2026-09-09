import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => new Map<string, string>());
vi.mock("../../shared/utils/async-storage", () => ({
  asyncStorage: {
    getItem: (key: string) => Promise.resolve(storage.get(key) ?? null),
    setItem: (key: string, value: string) => {
      storage.set(key, value);
      return Promise.resolve();
    },
  },
}));

import { useAgendaTip } from "./use-agenda-tip";

describe("Agenda tip dismissal", () => {
  beforeEach(() => storage.clear());
  afterEach(cleanup);

  it("keeps the dismissed tip hidden after leaving and returning to the agenda", async () => {
    const first = renderHook(() => useAgendaTip("account-a"));
    await waitFor(() => expect(first.result.current.visible).toBe(true));
    act(() => first.result.current.dismiss());
    expect(first.result.current.visible).toBe(false);
    first.unmount();
    const returning = renderHook(() => useAgendaTip("account-a"));
    await act(async () => {});
    expect(returning.result.current.visible).toBe(false);
  });

  it("does not apply another account's dismissal", async () => {
    const first = renderHook(() => useAgendaTip("account-a"));
    await waitFor(() => expect(first.result.current.visible).toBe(true));
    act(() => first.result.current.dismiss());
    first.unmount();
    const other = renderHook(() => useAgendaTip("account-b"));
    await waitFor(() => expect(other.result.current.visible).toBe(true));
  });

  it("does not flash a tip while the saved preference is loading", () => {
    const tip = renderHook(() => useAgendaTip("account-a"));
    expect(tip.result.current.visible).toBe(false);
  });
});
