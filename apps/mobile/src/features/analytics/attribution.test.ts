import { afterEach, describe, expect, it, vi } from "vitest";
import { createAttributionReader, parseInstallReferrer } from "./attribution";

afterEach(() => vi.useRealTimers());

describe("Google Play install attribution", () => {
  it("reads campaign tags and discards unrelated or sensitive query parameters", () => {
    expect(
      parseInstallReferrer(
        "utm_source=instagram&utm_medium=social&utm_campaign=retomada_202609&utm_content=preco&email=person%40example.com&token=secret",
      ),
    ).toEqual({
      source: "instagram",
      medium: "social",
      campaign: "retomada_202609",
      content: "preco",
    });
    expect(parseInstallReferrer("utm_source=person%40example.com")).toBeUndefined();
    expect(
      parseInstallReferrer("utm_source=instagram&utm_campaign=" + "x".repeat(101)),
    ).toEqual({ source: "instagram" });
    expect(parseInstallReferrer("not a campaign")).toBeUndefined();
  });

  it("supports the organic referrer returned by Play", () => {
    expect(parseInstallReferrer("utm_source=google-play&utm_medium=organic")).toEqual({
      source: "google-play",
      medium: "organic",
    });
  });

  it("returns without blocking when Play is unavailable and retries the next time", async () => {
    let available = false;
    const read = createAttributionReader(() => {
      if (!available) return Promise.reject(new Error("Store unavailable"));
      return Promise.resolve("utm_source=instagram");
    });
    expect(await read()).toBeUndefined();
    available = true;
    expect(await read()).toEqual({ source: "instagram" });
    available = false;
    expect(await read()).toEqual({ source: "instagram" });
  });

  it("bounds a hung native call", async () => {
    vi.useFakeTimers();
    const read = createAttributionReader(() => new Promise<string>(() => {}));
    const result = read();
    await vi.advanceTimersByTimeAsync(1500);
    expect(await result).toBeUndefined();
  });
});
