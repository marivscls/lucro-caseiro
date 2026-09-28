import { z } from "zod";

/**
 * Pix "copia e cola" estático (BR Code, padrão EMV do Banco Central), gerado
 * sem banco no meio e sem taxa. O valor vai embutido, então quem paga não
 * precisa digitar nada. Não confirma o pagamento sozinho: quem recebe continua
 * marcando a venda como paga.
 */

export const PixKeyType = z.enum(["cpf_cnpj", "phone", "email", "random"]);
export type PixKeyType = z.infer<typeof PixKeyType>;

export const PIX_KEY_TYPE_LABELS: Record<PixKeyType, string> = {
  cpf_cnpj: "CPF ou CNPJ",
  phone: "Celular",
  email: "E-mail",
  random: "Chave aleatória",
};

const onlyDigits = (value: string) => value.replace(/\D/g, "");

function validCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  const calc = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(digits[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
}

function validCnpj(digits: string): boolean {
  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) return false;
  const calc = (length: number) => {
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, weight, i) => acc + Number(digits[i]) * weight, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return calc(12) === Number(digits[12]) && calc(13) === Number(digits[13]);
}

/**
 * Normaliza a chave para o formato que vai no código: CPF/CNPJ só dígitos,
 * celular como +55DDDNÚMERO, e-mail minúsculo, aleatória minúscula.
 * Retorna null quando a chave não é válida para o tipo escolhido.
 */
export function normalizePixKey(type: PixKeyType, raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  switch (type) {
    case "cpf_cnpj": {
      const digits = onlyDigits(value);
      if (digits.length === 11) return validCpf(digits) ? digits : null;
      if (digits.length === 14) return validCnpj(digits) ? digits : null;
      return null;
    }
    case "phone": {
      let digits = onlyDigits(value);
      if (digits.length === 12 || digits.length === 13) {
        if (!digits.startsWith("55")) return null;
        digits = digits.slice(2);
      }
      if (!/^[1-9]{2}9?\d{8}$/.test(digits)) return null;
      return `+55${digits}`;
    }
    case "email": {
      const email = value.toLowerCase();
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 77
        ? email
        : null;
    }
    case "random": {
      const key = value.toLowerCase();
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(key)
        ? key
        : null;
    }
  }
}

/** Texto em ASCII simples (os leitores de Pix não aceitam acento). */
function asciiField(value: string, max: number): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();
}

function field(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

/** CRC16-CCITT (polinômio 0x1021, início 0xFFFF), exigido no campo 63. */
export function pixCrc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export interface PixPayloadInput {
  /** Chave já normalizada (use normalizePixKey). */
  key: string;
  /** Nome de quem recebe (até 25 letras no código). */
  receiverName: string;
  /** Cidade de quem recebe (até 15 letras no código). */
  city?: string | null;
  /** Valor em reais; sem valor, quem paga digita. */
  amount?: number | null;
  /** Identificador curto (letras e números) para a pessoa reconhecer o Pix. */
  txid?: string | null;
}

/** Monta o Pix copia e cola. */
export function buildPixPayload(input: PixPayloadInput): string {
  const name = asciiField(input.receiverName, 25) || "RECEBEDOR";
  const city = asciiField(input.city ?? "", 15) || "BRASIL";
  const txid = (input.txid ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";

  const merchant = field("00", "br.gov.bcb.pix") + field("01", input.key);
  const parts = [
    field("00", "01"),
    field("26", merchant),
    field("52", "0000"),
    field("53", "986"),
  ];
  if (input.amount != null && input.amount > 0) {
    parts.push(field("54", input.amount.toFixed(2)));
  }
  parts.push(
    field("58", "BR"),
    field("59", name),
    field("60", city),
    field("62", field("05", txid)),
  );
  const withoutCrc = `${parts.join("")}6304`;
  return `${withoutCrc}${pixCrc16(withoutCrc)}`;
}

/** Dados de Pix de quem vende, como a API devolve no perfil. */
export const PixSettingsDto = z.object({
  pixKeyType: PixKeyType.nullable(),
  pixKey: z.string().nullable(),
  pixCity: z.string().nullable(),
});
export type PixSettings = z.infer<typeof PixSettingsDto>;

/** Pix pronto para uma cobrança, ou null quando a pessoa ainda não cadastrou a chave. */
export function pixForCharge(
  settings: Partial<PixSettings> | null | undefined,
  receiverName: string,
  amount: number,
  txid?: string,
): string | null {
  if (!settings?.pixKey || !settings.pixKeyType) return null;
  const key = normalizePixKey(settings.pixKeyType, settings.pixKey);
  if (!key) return null;
  return buildPixPayload({
    key,
    receiverName,
    city: settings.pixCity,
    amount,
    txid,
  });
}
