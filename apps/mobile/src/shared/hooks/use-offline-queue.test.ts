import { describe, expect, it, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";

import { useOfflineQueue, processOfflineQueue } from "./use-offline-queue";

// Mock the api client
vi.mock("../utils/api-client", () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from "../utils/api-client";
const mockApiClient = vi.mocked(apiClient);

describe("useOfflineQueue", () => {
  beforeEach(() => {
    // Reset store between tests
    act(() => {
      useOfflineQueue.getState().clear();
      useOfflineQueue.setState({ isSyncing: false });
    });
    mockApiClient.mockReset();
  });

  describe("initial state", () => {
    it("operations starts as empty array", () => {
      expect(useOfflineQueue.getState().operations).toEqual([]);
    });

    it("isSyncing starts as false", () => {
      expect(useOfflineQueue.getState().isSyncing).toBe(false);
    });
  });

  describe("enqueue", () => {
    it("adds operation with correct fields", () => {
      act(() => {
        useOfflineQueue.getState().enqueue({
          method: "POST",
          endpoint: "/api/v1/sales",
          payload: { test: true },
        });
      });

      const ops = useOfflineQueue.getState().operations;
      expect(ops).toHaveLength(1);
      expect(ops[0].method).toBe("POST");
      expect(ops[0].endpoint).toBe("/api/v1/sales");
      expect(ops[0].payload).toEqual({ test: true });
      expect(ops[0].status).toBe("pending");
      expect(ops[0].retries).toBe(0);
      expect(ops[0].id).toBeTruthy();
      expect(ops[0].createdAt).toBeTruthy();
    });

    it("generates unique ids", () => {
      act(() => {
        useOfflineQueue.getState().enqueue({ method: "POST", endpoint: "/a" });
        useOfflineQueue.getState().enqueue({ method: "POST", endpoint: "/b" });
      });

      const ops = useOfflineQueue.getState().operations;
      expect(ops[0].id).not.toBe(ops[1].id);
    });

    it("respects 100 operation limit", () => {
      act(() => {
        for (let i = 0; i < 105; i++) {
          useOfflineQueue.getState().enqueue({ method: "POST", endpoint: `/test-${i}` });
        }
      });

      expect(useOfflineQueue.getState().operations).toHaveLength(100);
    });
  });

  describe("dequeue", () => {
    it("removes operation by id", () => {
      act(() => {
        useOfflineQueue.getState().enqueue({ method: "POST", endpoint: "/a" });
      });

      const id = useOfflineQueue.getState().operations[0].id;

      act(() => {
        useOfflineQueue.getState().dequeue(id);
      });

      expect(useOfflineQueue.getState().operations).toHaveLength(0);
    });

    it("does nothing if id not found", () => {
      act(() => {
        useOfflineQueue.getState().enqueue({ method: "POST", endpoint: "/a" });
      });

      act(() => {
        useOfflineQueue.getState().dequeue("non-existent");
      });

      expect(useOfflineQueue.getState().operations).toHaveLength(1);
    });
  });

  describe("markFailed", () => {
    it("changes status to failed and increments retries", () => {
      act(() => {
        useOfflineQueue.getState().enqueue({ method: "POST", endpoint: "/a" });
      });

      const id = useOfflineQueue.getState().operations[0].id;

      act(() => {
        useOfflineQueue.getState().markFailed(id);
      });

      const op = useOfflineQueue.getState().operations[0];
      expect(op.status).toBe("failed");
      expect(op.retries).toBe(1);
    });

    it("increments retries on consecutive calls", () => {
      act(() => {
        useOfflineQueue.getState().enqueue({ method: "POST", endpoint: "/a" });
      });

      const id = useOfflineQueue.getState().operations[0].id;

      act(() => {
        useOfflineQueue.getState().markFailed(id);
        useOfflineQueue.getState().markFailed(id);
        useOfflineQueue.getState().markFailed(id);
      });

      expect(useOfflineQueue.getState().operations[0].retries).toBe(3);
    });
  });

  describe("setSyncing", () => {
    it("updates isSyncing", () => {
      act(() => {
        useOfflineQueue.getState().setSyncing(true);
      });
      expect(useOfflineQueue.getState().isSyncing).toBe(true);

      act(() => {
        useOfflineQueue.getState().setSyncing(false);
      });
      expect(useOfflineQueue.getState().isSyncing).toBe(false);
    });
  });

  describe("clear", () => {
    it("removes all operations", () => {
      act(() => {
        useOfflineQueue.getState().enqueue({ method: "POST", endpoint: "/a" });
        useOfflineQueue.getState().enqueue({ method: "POST", endpoint: "/b" });
        useOfflineQueue.getState().clear();
      });

      expect(useOfflineQueue.getState().operations).toHaveLength(0);
    });
  });
});

describe("processOfflineQueue", () => {
  beforeEach(() => {
    act(() => {
      useOfflineQueue.getState().clear();
      useOfflineQueue.setState({ isSyncing: false });
    });
    mockApiClient.mockReset();
  });

  it("returns { synced: 0, failed: 0 } when queue is empty", async () => {
    const result = await processOfflineQueue("test-token");
    expect(result).toEqual({ synced: 0, failed: 0 });
  });

  it("processes pending operations and dequeues on success", async () => {
    act(() => {
      useOfflineQueue.getState().enqueue({
        method: "POST",
        endpoint: "/api/v1/sales",
        payload: { test: true },
      });
    });

    mockApiClient.mockResolvedValue({});

    const result = await processOfflineQueue("test-token");

    expect(result).toEqual({ synced: 1, failed: 0 });
    expect(useOfflineQueue.getState().operations).toHaveLength(0);
    expect(mockApiClient).toHaveBeenCalledWith("/api/v1/sales", {
      method: "POST",
      body: { test: true },
      token: "test-token",
    });
  });

  it("marks operation as failed on error", async () => {
    act(() => {
      useOfflineQueue.getState().enqueue({ method: "POST", endpoint: "/a" });
    });

    mockApiClient.mockRejectedValue(new Error("Network error"));

    const result = await processOfflineQueue("test-token");

    expect(result).toEqual({ synced: 0, failed: 1 });
    expect(useOfflineQueue.getState().operations[0].status).toBe("failed");
    expect(useOfflineQueue.getState().operations[0].retries).toBe(1);
  });

  it("skips operations with 3+ retries", async () => {
    act(() => {
      useOfflineQueue.getState().enqueue({ method: "POST", endpoint: "/a" });
      const id = useOfflineQueue.getState().operations[0].id;
      useOfflineQueue.getState().markFailed(id);
      useOfflineQueue.getState().markFailed(id);
      useOfflineQueue.getState().markFailed(id);
    });

    const result = await processOfflineQueue("test-token");

    expect(result).toEqual({ synced: 0, failed: 0 });
    expect(mockApiClient).not.toHaveBeenCalled();
  });

  it("continues processing after individual failures", async () => {
    act(() => {
      useOfflineQueue.getState().enqueue({ method: "POST", endpoint: "/a" });
      useOfflineQueue.getState().enqueue({ method: "POST", endpoint: "/b" });
    });

    mockApiClient.mockRejectedValueOnce(new Error("fail")).mockResolvedValueOnce({});

    const result = await processOfflineQueue("test-token");

    expect(result).toEqual({ synced: 1, failed: 1 });
  });

  it("sets isSyncing during processing", async () => {
    act(() => {
      useOfflineQueue.getState().enqueue({ method: "POST", endpoint: "/a" });
    });

    mockApiClient.mockResolvedValue({});

    const syncingStates: boolean[] = [];
    const unsub = useOfflineQueue.subscribe((s) => syncingStates.push(s.isSyncing));

    await processOfflineQueue("test-token");
    unsub();

    expect(syncingStates).toContain(true);
    expect(useOfflineQueue.getState().isSyncing).toBe(false);
  });
});
