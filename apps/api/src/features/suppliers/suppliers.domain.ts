import type { CreateSupplierData } from "./suppliers.types";

export function validateSupplierData(data: CreateSupplierData): string[] {
  const errors: string[] = [];

  if (data.name.trim().length === 0) {
    errors.push("Nome do fornecedor é obrigatório");
  }

  if (data.name.length > 200) {
    errors.push("Nome do fornecedor deve ter no máximo 200 caracteres");
  }

  if (data.phone !== undefined && data.phone.trim().length > 0) {
    const digits = data.phone.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) {
      errors.push("Telefone deve ter entre 8 e 15 dígitos");
    }
  }

  if (data.email !== undefined && data.email.trim().length > 0) {
    if (!isValidEmail(data.email)) {
      errors.push("Email inválido");
    }
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
