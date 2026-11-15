import { afterEach, describe, expect, it, vi } from "vitest";

import { exportHtmlPdf } from "./export-html.web";

describe("exportHtmlPdf no navegador", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("imprime num iframe da própria página, sem abrir janela nova", async () => {
    // Arrange
    const open = vi.spyOn(window, "open");
    const print = vi.fn();
    const appendChild = vi.spyOn(document.body, "appendChild");
    appendChild.mockImplementation(<T extends Node>(node: T): T => {
      const frame = node as unknown as HTMLIFrameElement;
      Object.defineProperty(frame, "contentWindow", {
        configurable: true,
        value: { print, focus: vi.fn(), addEventListener: vi.fn() },
      });
      queueMicrotask(() => frame.dispatchEvent(new Event("load")));
      return node;
    });

    // Act
    await exportHtmlPdf("<h1>Recibo</h1>", { dialogTitle: "Enviar recibo" });

    // Assert
    const frame = appendChild.mock.calls[0]?.[0] as HTMLIFrameElement;
    expect(frame.tagName).toBe("IFRAME");
    expect(frame.srcdoc).toBe("<h1>Recibo</h1>");
    expect(print).toHaveBeenCalledOnce();
    expect(open).not.toHaveBeenCalled();
  });

  it("avisa quando o navegador não prepara o documento", async () => {
    // Arrange
    vi.spyOn(document.body, "appendChild").mockImplementation(
      <T extends Node>(node: T): T => {
        const frame = node as unknown as HTMLIFrameElement;
        Object.defineProperty(frame, "contentWindow", { value: null });
        queueMicrotask(() => frame.dispatchEvent(new Event("load")));
        return node;
      },
    );

    // Act / Assert
    await expect(
      exportHtmlPdf("<h1>Recibo</h1>", { dialogTitle: "Enviar recibo" }),
    ).rejects.toThrow("não conseguiu preparar");
  });
});
