import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { exportHtmlPdf } from "./export-html.web";

describe("exportHtmlPdf no navegador", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:relatorio"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  it("abre o documento gerado e chama a impressão", async () => {
    const print = vi.fn();
    const focus = vi.fn();
    const addEventListener = vi.fn((_event, listener: EventListener) =>
      listener({} as Event),
    );
    const popup = { opener: window, print, focus, addEventListener } as unknown as Window;

    vi.spyOn(window, "open").mockReturnValue(popup);
    vi.spyOn(window, "setTimeout").mockReturnValue(
      1 as unknown as ReturnType<typeof window.setTimeout>,
    );

    await exportHtmlPdf("<h1>Recibo</h1>", { dialogTitle: "Enviar recibo" });

    expect(window.open).toHaveBeenCalledWith("blob:relatorio", "_blank");
    expect(focus).toHaveBeenCalledOnce();
    expect(print).toHaveBeenCalledOnce();
  });
});
