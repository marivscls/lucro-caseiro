import type { CreateSupplierData } from "./suppliers.types";

export function validateSupplierData(data: CreateSupplierData): string[] {
  const errors: string[] = [];

  const normalizedName = data.name.trim();
  if (normalizedName.length === 0) {
    errors.push("Nome do fornecedor é obrigatório");
  } else if (normalizedName.length < 2) {
    errors.push("Nome do fornecedor deve ter pelo menos 2 caracteres");
  }

  if (normalizedName.length > 200) {
    errors.push("Nome do fornecedor deve ter no máximo 200 caracteres");
  }

  if (data.phone != null && data.phone.trim().length > 0) {
    const digits = data.phone.replace(/\D/g, "");
    const isBrazilian =
      digits.length === 10 ||
      digits.length === 11 ||
      ((digits.length === 12 || digits.length === 13) && digits.startsWith("55"));
    if (!isBrazilian) {
      errors.push("Telefone brasileiro deve ter DDD e 10 ou 11 dígitos");
    }
  }

  if (data.email != null && data.email.trim().length > 0) {
    if (!isValidEmail(data.email)) {
      errors.push("Email inválido");
    }
  }

  if ((data.address?.trim().length ?? 0) > 500) {
    errors.push("Endereço deve ter no máximo 500 caracteres");
  }

  if ((data.purchaseDescription?.trim().length ?? 0) > 500) {
    errors.push("Descrição de compras deve ter no máximo 500 caracteres");
  }

  if ((data.notes?.trim().length ?? 0) > 2000) {
    errors.push("Observações devem ter no máximo 2000 caracteres");
  }

  if (data.hasWhatsApp && !data.phone?.trim()) {
    errors.push("Informe um telefone para ativar o WhatsApp");
  }

  if (data.avatarType === "preset" && !data.avatarPresetId) {
    errors.push("Selecione uma ilustração para o fornecedor");
  }

  if (
    data.avatarType === "preset" &&
    data.avatarPresetId &&
    data.category &&
    !data.avatarPresetId.startsWith(`${data.category}-`)
  ) {
    errors.push("A ilustração selecionada não pertence à categoria do fornecedor");
  }

  if (data.avatarType === "upload" && !data.avatarUrl) {
    errors.push("Envie a imagem do fornecedor");
  }

  return errors;
}

// Validação linear (sem regex com backtracking): exige um "@" no meio e um "."
// depois dele, sem espaços. Suficiente como guarda de domínio — o formato fino
// já é validado pelo Zod (`z.string().email()`) na borda da rota.
function isValidEmail(email: string): boolean {
  if (/\s/.test(email)) return false;
  const at = email.indexOf("@");
  if (at <= 0) return false;
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  return dot > 0 && dot < domain.length - 1;
}

export function monthlySupplierPurchaseSummary(
  purchases: readonly {
    purchasedAt: string;
    amount: string | number;
    supplierId: string | null;
  }[],
  now: Date,
) {
  const start = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const end = `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const current = purchases.filter(
    (purchase) => purchase.purchasedAt >= start && purchase.purchasedAt < end,
  );
  return {
    totalAmount:
      current.reduce(
        (totalInCents, purchase) =>
          totalInCents + Math.round(Number(purchase.amount) * 100),
        0,
      ) / 100,
    purchaseCount: current.length,
    supplierCount: new Set(
      current.map((purchase) => purchase.supplierId).filter((id): id is string => !!id),
    ).size,
  };
}
