import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

function worker() {
  const listeners: Record<string, (event: unknown) => void> = {};
  const showNotification = vi.fn().mockResolvedValue(undefined);
  const openWindow = vi.fn();
  const self = {
    location: { origin: "https://app.example.com" },
    registration: { showNotification },
    clients: { matchAll: () => Promise.resolve([]), openWindow },
    addEventListener: (name: string, fn: (event: unknown) => void) => {
      listeners[name] = fn;
    },
  };
  // Executes only our checked-in worker artifact against an isolated fake browser.
  // eslint-disable-next-line sonarjs/code-eval
  runInNewContext(readFileSync("public/push-worker.js", "utf8"), { self, URL });
  return { listeners, showNotification, openWindow };
}
describe("push service worker", () => {
  it("displays pushes without a page and opens their destination", async () => {
    const { listeners, showNotification, openWindow } = worker();
    let pending: Promise<unknown> = Promise.resolve();
    listeners.push({
      data: {
        json: () => ({
          title: "Agenda",
          body: "Entrega amanhã",
          url: "/tabs/agenda",
          tag: "today",
        }),
      },
      waitUntil: (p: Promise<unknown>) => {
        pending = p;
      },
    });
    await pending;
    expect(showNotification).toHaveBeenCalledWith(
      "Agenda",
      expect.objectContaining({
        body: "Entrega amanhã",
        data: { url: "https://app.example.com/tabs/agenda" },
      }),
    );
    listeners.notificationclick({
      notification: {
        close: vi.fn(),
        data: { url: "https://app.example.com/tabs/agenda" },
      },
      waitUntil: (p: Promise<unknown>) => {
        pending = p;
      },
    });
    await pending;
    expect(openWindow).toHaveBeenCalledWith("https://app.example.com/tabs/agenda");
  });
  it("rejects external notification links", async () => {
    const { listeners, openWindow } = worker();
    let pending: Promise<unknown> = Promise.resolve();
    listeners.notificationclick({
      notification: { close: vi.fn(), data: { url: "https://evil.test" } },
      waitUntil: (p: Promise<unknown>) => {
        pending = p;
      },
    });
    await pending;
    expect(openWindow).toHaveBeenCalledWith("https://app.example.com/");
  });
});
