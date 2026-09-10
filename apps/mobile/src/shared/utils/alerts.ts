import { showAlert } from "../components/alert-store";
import { userErrorMessage } from "@lucro-caseiro/contracts";

const VALIDATION_TITLE = "Opa!";
const ERROR_TITLE = "Não foi possível concluir";

/** Aviso de validacao local (campo obrigatorio, formato invalido, etc). */
export function alertValidation(message: string) {
  showAlert({ title: VALIDATION_TITLE, message });
}

/** Falha de operacao (rede, API). Aceita Error, string ou nada. */
export function alertError(error?: unknown) {
  showAlert({ title: ERROR_TITLE, message: errorMessage(error) });
}

export function errorMessage(error?: unknown): string {
  return userErrorMessage(error);
}
