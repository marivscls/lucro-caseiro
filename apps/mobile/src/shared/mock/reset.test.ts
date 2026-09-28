import { describe, expect, it, vi } from "vitest";

import { isResetRequested, resetDemoIfRequested, urlWithoutReset } from "./reset";

function makeStorage(): Storage {
  const values = new Map<string, string>([["auth:signed-in-on-device", "1"]]);
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

function makeSut(href: string) {
  const url = new URL(href);
  const storage = makeStorage();
  const replace = vi.fn();
  const leaveListeners: (() => void)[] = [];
  const env = {
    location: { href, search: url.search, replace },
    storages: [storage],
    onLeave: (listener: () => void) => leaveListeners.push(listener),
  };
  return { env, storage, replace, leaveListeners };
}

describe("reset da demonstração", () => {
  it("reconhece ?reset=1 e ?reset=true", () => {
    expect(isResetRequested("?reset=1")).toBe(true);
    expect(isResetRequested("?a=2&reset=true")).toBe(true);
    expect(isResetRequested("?reset=0")).toBe(false);
    expect(isResetRequested("")).toBe(false);
  });

  it("remove só o parâmetro de reset da URL", () => {
    expect(urlWithoutReset("https://demo.app/tabs?reset=1&x=2#top")).toBe(
      "/tabs?x=2#top",
    );
  });

  it("limpa o storage e recarrega sem o parâmetro", () => {
    // Arrange
    const { env, storage, replace } = makeSut("https://demo.app/?reset=1");

    // Act
    const reset = resetDemoIfRequested(env);

    // Assert
    expect(reset).toBe(true);
    expect(storage.length).toBe(0);
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("descarta gravações feitas antes de sair da página", () => {
    // Arrange
    const { env, storage, leaveListeners } = makeSut("https://demo.app/?reset=1");
    resetDemoIfRequested(env);
    storage.setItem("late-write", "1");

    // Act
    leaveListeners.forEach((listener) => listener());

    // Assert
    expect(storage.getItem("late-write")).toBeNull();
  });

  it("não faz nada sem o parâmetro", () => {
    // Arrange
    const { env, storage, replace } = makeSut("https://demo.app/tabs");

    // Act
    const reset = resetDemoIfRequested(env);

    // Assert
    expect(reset).toBe(false);
    expect(storage.length).toBe(1);
    expect(replace).not.toHaveBeenCalled();
  });
});
