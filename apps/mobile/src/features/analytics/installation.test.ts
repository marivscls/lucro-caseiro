import { describe, expect, it, vi } from "vitest";

import {
  createInstallationId,
  getOrCreateInstallationId,
  type InstallationStorage,
} from "./installation";

describe("createInstallationId", () => {
  it("gera UUID v4 válido", () => {
    expect(createInstallationId(() => 0.5)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});

describe("getOrCreateInstallationId", () => {
  it("reutiliza a identidade persistida", async () => {
    const setItem = vi.fn(() => Promise.resolve());
    const storage: InstallationStorage = {
      getItem: vi.fn(() => Promise.resolve("0cbd1c3e-1755-4f3f-a1bf-40c12b267ac3")),
      setItem,
    };

    await expect(getOrCreateInstallationId(storage)).resolves.toBe(
      "0cbd1c3e-1755-4f3f-a1bf-40c12b267ac3",
    );
    expect(setItem).not.toHaveBeenCalled();
  });

  it("cria e salva uma identidade quando ainda não existe", async () => {
    const setItem = vi.fn(() => Promise.resolve());
    const storage: InstallationStorage = {
      getItem: vi.fn(() => Promise.resolve(null)),
      setItem,
    };

    const result = await getOrCreateInstallationId(storage);

    expect(result).toMatch(/^[0-9a-f-]{36}$/);
    expect(setItem).toHaveBeenCalledWith("analytics:installation-id", result);
  });
});
