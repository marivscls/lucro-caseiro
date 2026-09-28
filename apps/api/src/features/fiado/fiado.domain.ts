import { randomBytes } from "node:crypto";

import {
  normalizePixKey,
  type PixSettings,
  type UpdatePixSettings,
} from "@lucro-caseiro/contracts";

/** Token do link público: 16 caracteres aleatórios (URL-safe), impossível de adivinhar. */
export function newFiadoToken(): string {
  return randomBytes(12).toString("base64url");
}

export function isFiadoToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{16}$/.test(value);
}

/**
 * Valida e normaliza a chave antes de gravar. Chave vazia ou tipo nulo apagam
 * o Pix. Devolve a mensagem de erro em português quando a chave não confere.
 */
export function preparePixSettings(
  data: UpdatePixSettings,
): { ok: true; value: PixSettings } | { ok: false; error: string } {
  const city = data.pixCity?.trim() || null;
  if (!data.pixKeyType || !data.pixKey?.trim()) {
    return { ok: true, value: { pixKeyType: null, pixKey: null, pixCity: city } };
  }
  const key = normalizePixKey(data.pixKeyType, data.pixKey);
  if (!key) {
    const hints: Record<string, string> = {
      cpf_cnpj: "Confira os números do CPF ou CNPJ.",
      phone: "Use o celular com DDD, por exemplo (11) 98765-4321.",
      email: "Confira o e-mail da chave.",
      random: "Copie a chave aleatória inteira, do jeito que o banco mostra.",
    };
    return {
      ok: false,
      error: `Essa chave Pix não parece válida. ${hints[data.pixKeyType] ?? ""}`.trim(),
    };
  }
  return { ok: true, value: { pixKeyType: data.pixKeyType, pixKey: key, pixCity: city } };
}

/** Saldo em aberto de cada venda e o total do extrato. */
export function statementTotals(sales: Array<{ total: number; paidAmount: number }>): {
  open: number[];
  total: number;
} {
  const open = sales.map((sale) =>
    Math.max(0, Math.round((sale.total - sale.paidAmount) * 100) / 100),
  );
  const total = Math.round(open.reduce((sum, value) => sum + value, 0) * 100) / 100;
  return { open, total };
}
