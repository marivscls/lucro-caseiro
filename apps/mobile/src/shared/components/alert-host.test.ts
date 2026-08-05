import { describe, expect, it } from "vitest";

import { shouldStackAlertButtons } from "./alert-host";

describe("shouldStackAlertButtons", () => {
  it("empilha duas ações quando um rótulo longo reduziria demais a fonte", () => {
    expect(
      shouldStackAlertButtons([
        { text: "Nova venda" },
        { text: "Ver e compartilhar recibo" },
      ]),
    ).toBe(true);
  });

  it("mantém duas ações curtas lado a lado", () => {
    expect(shouldStackAlertButtons([{ text: "Cancelar" }, { text: "Excluir" }])).toBe(
      false,
    );
  });
});
