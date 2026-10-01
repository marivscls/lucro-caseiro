import { beforeEach, describe, expect, it, vi } from "vitest";
const native = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}));
vi.mock("../utils/supabase", () => ({ authStorage: native }));
import { Platform } from "react-native";
import { createDraftStorage } from "./storage";
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.clearAllMocks();
});

describe("storage temporário de cadastros", () => {
  it("web guarda somente nesta aba e nunca em localStorage", async () => {
    const previous = Platform.OS;
    Object.assign(Platform, { OS: "web" });
    try {
      await createDraftStorage.setItem("qa", "rascunho");
      expect(await createDraftStorage.getItem("qa")).toBe("rascunho");
      expect(localStorage.length).toBe(0);
      expect(native.setItem).not.toHaveBeenCalled();
      await createDraftStorage.removeItem("qa");
      expect(sessionStorage.length).toBe(0);
    } finally {
      Object.assign(Platform, { OS: previous });
    }
  });
  it("nativo usa o adapter protegido; Unicode vira ASCII antes de seus chunks", async () => {
    const previous = Platform.OS;
    Object.assign(Platform, { OS: "android" });
    try {
      const input = JSON.stringify({ name: "Açúcar 🧁" });
      await createDraftStorage.setItem("qa", input);
      const encoded = native.setItem.mock.calls[0][1] as string;
      expect(encoded).toMatch(/\\u00e7/);
      expect(encoded.split("").every((character) => character.charCodeAt(0) <= 127)).toBe(
        true,
      );
      expect(JSON.parse(encoded)).toEqual(JSON.parse(input));
      expect(sessionStorage.length + localStorage.length).toBe(0);
      native.getItem.mockResolvedValue(encoded);
      expect(await createDraftStorage.getItem("qa")).toBe(encoded);
      await createDraftStorage.removeItem("qa");
      expect(native.removeItem).toHaveBeenCalledWith("qa");
    } finally {
      Object.assign(Platform, { OS: previous });
    }
  });
});
