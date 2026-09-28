import {
  type PixKeyType,
  type PixSettings,
  normalizePixKey,
  pixForCharge,
} from "@lucro-caseiro/contracts";

/** Nome que aparece para quem paga: o do negócio, senão o da pessoa. */
export function pixReceiverName(
  profile: { businessName?: string | null; name?: string | null } | null | undefined,
): string {
  return profile?.businessName?.trim() || profile?.name?.trim() || "Recebedor";
}

/** Pix copia e cola para um valor, ou null sem chave cadastrada ou sem valor. */
export function chargePix(
  settings: PixSettings | null | undefined,
  profile: { businessName?: string | null; name?: string | null } | null | undefined,
  amount: number,
): string | null {
  if (Number.isNaN(amount) || amount <= 0) return null;
  return pixForCharge(settings, pixReceiverName(profile), amount);
}

export function hasPixKey(settings: PixSettings | null | undefined): boolean {
  return !!settings?.pixKey && !!settings.pixKeyType;
}

export const PIX_KEY_PLACEHOLDERS: Record<PixKeyType, string> = {
  cpf_cnpj: "Ex: 123.456.789-09",
  phone: "Ex: (11) 98765-4321",
  email: "Ex: voce@email.com",
  random: "Ex: 123e4567-e89b-12d3-a456-426614174000",
};

export type PixKeyboard = "number-pad" | "phone-pad" | "email-address" | "default";

export const PIX_KEY_KEYBOARDS: Record<PixKeyType, PixKeyboard> = {
  cpf_cnpj: "number-pad",
  phone: "phone-pad",
  email: "email-address",
  random: "default",
};

/** Erro em português para a chave digitada, ou null quando está boa. */
export function pixKeyError(type: PixKeyType, raw: string): string | null {
  if (!raw.trim()) return "Digite a sua chave Pix.";
  if (normalizePixKey(type, raw)) return null;
  const hints: Record<PixKeyType, string> = {
    cpf_cnpj: "Confira os números do CPF ou CNPJ.",
    phone: "Use o celular com DDD.",
    email: "Confira o e-mail.",
    random: "Copie a chave aleatória inteira, como o banco mostra.",
  };
  return `Essa chave não parece válida. ${hints[type]}`;
}

/** Chave mascarada para mostrar na tela (ex.: "•••.456.789-••"). */
export function maskedPixKey(settings: PixSettings | null | undefined): string {
  const key = settings?.pixKey;
  if (!key) return "";
  if (settings.pixKeyType === "cpf_cnpj" && key.length === 11) {
    return `•••.${key.slice(3, 6)}.${key.slice(6, 9)}-••`;
  }
  if (settings.pixKeyType === "phone") {
    return `${key.slice(0, 5)} •••••-${key.slice(-4)}`;
  }
  return key;
}
