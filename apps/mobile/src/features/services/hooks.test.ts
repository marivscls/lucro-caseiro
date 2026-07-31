import type {
  ServiceBookingRequest,
  ServiceBookingRequestStatus,
} from "@lucro-caseiro/contracts";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateServiceBookingRequest } from "./hooks";

type Variables = { id: string; status: ServiceBookingRequestStatus };
type MutationContext = { previous?: ServiceBookingRequest[] };

const mocks = vi.hoisted(() => ({
  cancelQueries: vi.fn().mockResolvedValue(undefined),
  getQueryData: vi.fn(),
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
  mutationConfig: null as null | {
    onMutate: (variables: Variables) => Promise<MutationContext>;
    onError: (error: Error, variables: Variables, context?: MutationContext) => void;
    onSettled: () => void;
  },
  setQueryData: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: (config: NonNullable<typeof mocks.mutationConfig>) => {
    mocks.mutationConfig = config;
    return {};
  },
  useQueryClient: () => ({
    cancelQueries: mocks.cancelQueries,
    getQueryData: mocks.getQueryData,
    invalidateQueries: mocks.invalidateQueries,
    setQueryData: mocks.setQueryData,
  }),
}));

vi.mock("../../shared/hooks/use-auth", () => ({
  useAuth: () => ({ token: "token" }),
}));

vi.mock("./api", () => ({
  updateServiceBookingRequest: vi.fn(),
}));

describe("useUpdateServiceBookingRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mutationConfig = null;
  });

  it("reflete o novo status imediatamente e restaura o anterior se falhar", async () => {
    const previous = [
      { id: "booking-1", status: "contacted" },
      { id: "booking-2", status: "new" },
    ] as ServiceBookingRequest[];
    mocks.getQueryData.mockReturnValue(previous);

    renderHook(() => useUpdateServiceBookingRequest("service-1"));

    const variables = {
      id: "booking-1",
      status: "confirmed" as const,
    };
    const context = await mocks.mutationConfig?.onMutate(variables);
    const optimisticUpdater = mocks.setQueryData.mock.calls[0]?.[1] as (
      current: ServiceBookingRequest[],
    ) => ServiceBookingRequest[];

    expect(optimisticUpdater(previous)).toEqual([
      { id: "booking-1", status: "confirmed" },
      { id: "booking-2", status: "new" },
    ]);

    mocks.mutationConfig?.onError(new Error("offline"), variables, context);
    expect(mocks.setQueryData).toHaveBeenLastCalledWith(
      ["services", "service-1", "booking-requests"],
      previous,
    );

    mocks.mutationConfig?.onSettled();
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["services", "service-1", "booking-requests"],
    });
  });
});
