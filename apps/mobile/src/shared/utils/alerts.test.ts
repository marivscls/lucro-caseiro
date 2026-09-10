import { afterEach, describe, expect, it } from "vitest";
import { alertError, errorMessage, alertValidation } from "./alerts";
import { showAlert, useAppAlert } from "../components/alert-store";

afterEach(() => useAppAlert.getState().hide());

describe("mensagens para o usuário", () => {
  it.each([
    "Recurso comprasComEstoque desativado para esta marca.",
    "Cannot read properties of undefined (reading 'id')",
    "duplicate key value violates unique constraint purchases_pkey",
    "Unexpected token '<', not valid JSON",
    "HTTP 502",
    "Expected number, received string",
  ])("não expõe a mensagem técnica %s", (message) => {
    expect(errorMessage(new Error(message))).not.toContain(message);
    alertError(message);
    expect(useAppAlert.getState().options?.message).not.toContain(message);
    showAlert({ title: "Erro ao salvar", message });
    expect(useAppAlert.getState().options?.message).not.toContain(message);
  });

  it("preserva instruções úteis de validação", () => {
    alertValidation("Informe um valor maior que zero.");
    expect(useAppAlert.getState().options?.message).toBe(
      "Informe um valor maior que zero.",
    );
  });

  it("oferece orientação específica para falha de conexão", () => {
    alertError(new TypeError("Network request failed"));
    expect(useAppAlert.getState().options?.message).toMatch(/internet/i);
    expect(useAppAlert.getState().options?.title).not.toBe("Erro");
  });
});
