import type { Order } from "@lucro-caseiro/contracts";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCreateOrder } from "./hooks";

const mocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
  mutationConfig: null as null | {
    onSuccess: (order: Order) => void;
  },
  scheduleOrderReminder: vi.fn().mockResolvedValue(undefined),
  trackAnalyticsAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: (config: { onSuccess: (order: Order) => void }) => {
    mocks.mutationConfig = config;
    return {};
  },
  useQueryClient: () => ({
    invalidateQueries: mocks.invalidateQueries,
  }),
}));

vi.mock("../../shared/hooks/use-auth", () => ({
  useAuth: () => ({ token: "token" }),
}));

vi.mock("./api", () => ({
  createOrder: vi.fn(),
}));

vi.mock("./reminders", () => ({
  cancelOrderReminder: vi.fn(),
  scheduleOrderReminder: mocks.scheduleOrderReminder,
}));

vi.mock("../analytics/tracker", () => ({
  trackAnalyticsAction: mocks.trackAnalyticsAction,
}));

describe("useCreateOrder", () => {
  beforeEach(() => {
    mocks.invalidateQueries.mockClear();
    mocks.scheduleOrderReminder.mockClear();
    mocks.trackAnalyticsAction.mockClear();
    mocks.mutationConfig = null;
  });

  it("atualiza a Agenda e os indicadores de Serviços após agendar", () => {
    renderHook(() => useCreateOrder());

    mocks.mutationConfig?.onSuccess({ id: "order-1" } as Order);

    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["orders"],
    });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["services"],
    });
    expect(mocks.scheduleOrderReminder).toHaveBeenCalledOnce();
  });
});
