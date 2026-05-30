import { Alert, Linking } from "react-native";

import { isoToBR } from "./date";
import { isValidBrazilPhone } from "./phone";

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

function textSuffix(message?: string): string {
  return message ? `?text=${encodeURIComponent(message)}` : "";
}

async function openOrWarn(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert(
      "Não foi possível abrir o WhatsApp",
      "Verifique se o WhatsApp está instalado neste aparelho.",
    );
    return false;
  }
}

/**
 * Abre uma conversa no WhatsApp, opcionalmente com mensagem pré-preenchida.
 * Valida o número antes; avisa se for inválido ou se o WhatsApp não abrir.
 */
export async function openWhatsApp(phone: string, message?: string): Promise<boolean> {
  if (!isValidBrazilPhone(phone)) {
    Alert.alert(
      "Telefone inválido",
      "Confira o número do cliente — precisa de DDD + número (ex: (11) 99999-9999).",
    );
    return false;
  }
  return openOrWarn(`https://wa.me/${normalizePhone(phone)}${textSuffix(message)}`);
}

/**
 * Abre o WhatsApp com a mensagem pronta, mas sem destinatário — o usuário
 * escolhe o contato. Útil quando não há telefone salvo (ex: venda avulsa).
 */
export async function openWhatsAppShare(message: string): Promise<boolean> {
  return openOrWarn(`https://wa.me/${textSuffix(message)}`);
}

const firstName = (name: string) => name.trim().split(" ")[0] ?? name;

const greeting = (name: string | null): string =>
  name ? `Oi, ${firstName(name)}` : "Oi";

/** Mensagens prontas (pt-BR). */
export const waMessages = {
  birthday: (name: string) =>
    `${greeting(name)}! 🎉 Passando para desejar um feliz aniversário! Muitas felicidades. 🥳`,
  orderConfirm: (clientName: string | null, title: string, deliveryDate: string) =>
    `${greeting(clientName)}! Confirmando sua encomenda: ${title}, para ${isoToBR(deliveryDate)}. Qualquer coisa é só me chamar! 😊`,
  orderReady: (clientName: string | null, title: string) =>
    `${greeting(clientName)}! Seu pedido "${title}" está pronto! 😍 Quando puder buscar/combinar a entrega, me avisa.`,
};
