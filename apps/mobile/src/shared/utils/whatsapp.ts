import { Linking } from "react-native";

/**
 * Normaliza telefone BR para o formato do wa.me (só dígitos, com DDI 55).
 * Usa o tamanho para decidir o DDI (mais seguro que checar prefixo "55", que
 * confundiria a cidade de DDD 55): 10–11 dígitos = nacional (adiciona 55);
 * 12–13 dígitos = já tem o DDI (mantém).
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length <= 11 ? `55${digits}` : digits;
}

/** Abre uma conversa no WhatsApp, opcionalmente com mensagem pré-preenchida. */
export function openWhatsApp(phone: string, message?: string): void {
  const number = normalizePhone(phone);
  const suffix = message ? `?text=${encodeURIComponent(message)}` : "";
  void Linking.openURL(`https://wa.me/${number}${suffix}`);
}

/**
 * Abre o WhatsApp com a mensagem pronta, mas sem destinatário — o usuário
 * escolhe o contato. Útil quando não há telefone salvo (ex: venda avulsa).
 */
export function openWhatsAppShare(message: string): void {
  void Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
}

const firstName = (name: string) => name.trim().split(" ")[0] ?? name;

const greeting = (name: string | null): string =>
  name ? `Oi, ${firstName(name)}` : "Oi";

function dateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Mensagens prontas (pt-BR). */
export const waMessages = {
  birthday: (name: string) =>
    `${greeting(name)}! 🎉 Passando para desejar um feliz aniversário! Muitas felicidades. 🥳`,
  orderConfirm: (clientName: string | null, title: string, deliveryDate: string) =>
    `${greeting(clientName)}! Confirmando sua encomenda: ${title}, para ${dateBR(deliveryDate)}. Qualquer coisa é só me chamar! 😊`,
  orderReady: (clientName: string | null, title: string) =>
    `${greeting(clientName)}! Seu pedido "${title}" está pronto! 😍 Quando puder buscar/combinar a entrega, me avisa.`,
};
