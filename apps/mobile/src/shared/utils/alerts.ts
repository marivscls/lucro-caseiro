import { showAlert } from "../components/alert-store";
import { userErrorMessage } from "@lucro-caseiro/contracts";

const VALIDATION_TITLE = "Opa!";
const ERROR_TITLE = "Não foi possível concluir";

/** Aviso de validacao local (campo obrigatorio, formato invalido, etc). */
export function alertValidation(message: string) {
  showAlert({ title: VALIDATION_TITLE, message });
}

/**
 * Falha de operacao (rede, API). Aceita Error, string ou nada.
 * Passe o erro capturado + um texto reserva: o motivo real (sem internet,
 * limite do plano, dado invalido) aparece quando e legivel; o reserva so
 * entra quando o erro e tecnico ou vazio.
 */
export function alertError(error?: unknown, fallback?: string) {
  showAlert({ title: ERROR_TITLE, message: errorMessage(error, fallback) });
}

export function errorMessage(error?: unknown, fallback?: string): string {
  return fallback === undefined
    ? userErrorMessage(error)
    : userErrorMessage(error, fallback);
}
