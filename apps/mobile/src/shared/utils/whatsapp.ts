import { Linking } from "react-native";

/** Normaliza telefone BR para o formato do wa.me (só dígitos, com DDI 55). */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
}

/** Abre uma conversa no WhatsApp, opcionalmente com mensagem pré-preenchida. */
export function openWhatsApp(phone: string, message?: string): void {
  const number = normalizePhone(phone);
  const suffix = message ? `?text=${encodeURIComponent(message)}` : "";
  void Linking.openURL(`https://wa.me/${number}${suffix}`);
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
