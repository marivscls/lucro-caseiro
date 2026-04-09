import type { CreateClientData } from "./clients.types";

export function validateClientData(data: CreateClientData): string[] {
  const errors: string[] = [];

  if (data.name.trim().length === 0) {
    errors.push("Nome do cliente e obrigatorio");
  }

  if (data.name.length > 200) {
    errors.push("Nome do cliente deve ter no maximo 200 caracteres");
  }

  if (data.phone !== undefined && data.phone.trim().length > 0) {
    const digits = data.phone.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) {
      errors.push("Telefone deve ter entre 8 e 15 digitos");
    }
  }

  return errors;
}

export function isUpcomingBirthday(
  birthday: string | null,
  today: Date = new Date(),
): boolean {
  if (!birthday) return false;

  const [year, month, day] = birthday.split("-").map(Number);
  if (!year || !month || !day) return false;

  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  if (month !== currentMonth) return false;

  const diff = day - currentDay;
  return diff >= 0 && diff <= 7;
}

export function formatPhoneForWhatsApp(phone: string | null): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return null;

  if (digits.startsWith("55")) {
    return digits;
  }

  return `55${digits}`;
}
