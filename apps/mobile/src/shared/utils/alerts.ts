import { Alert } from "react-native";

const VALIDATION_TITLE = "Opa!";
const ERROR_TITLE = "Erro";
const DEFAULT_ERROR_MESSAGE = "Algo deu errado. Tente novamente.";

/** Aviso de validacao local (campo obrigatorio, formato invalido, etc). */
export function alertValidation(message: string) {
  Alert.alert(VALIDATION_TITLE, message);
}

/** Falha de operacao (rede, API). Aceita Error, string ou nada. */
export function alertError(error?: unknown) {
  Alert.alert(ERROR_TITLE, errorMessage(error));
}

export function errorMessage(error?: unknown): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error instanceof Error && error.message.trim()) return error.message;
  return DEFAULT_ERROR_MESSAGE;
}
