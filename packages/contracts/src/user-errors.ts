/** Mensagens públicas compartilhadas pelo app e pela Central. */
export const USER_ERROR_MESSAGES = {
  default: "Não foi possível concluir a operação. Tente novamente.",
  network: "Não foi possível conectar. Verifique sua internet e tente novamente.",
  timeout:
    "A operação demorou mais que o esperado. Confira se ela foi concluída antes de tentar novamente.",
  response:
    "Não foi possível confirmar o resultado. Atualize a tela antes de tentar novamente.",
  unavailable: "Este recurso não está disponível nesta versão do aplicativo.",
  session: "Sua sessão expirou. Entre novamente para continuar.",
  forbidden: "Você não tem permissão para realizar esta ação.",
  validation: "Confira os dados preenchidos e tente novamente.",
  busy: "Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.",
} as const;

const TECHNICAL_MESSAGE =
  /(?:\b(?:TypeError|SyntaxError|ReferenceError|RangeError|Error:|HTTP\s*\d{3}|SQL|SQLSTATE|PGRST\w*|ECONN\w*|ENOTFOUND|undefined|null|NaN)\b|Cannot read|is not a function|Unexpected token|Unexpected end|JSON|Failed query|duplicate key|violates .*constraint|relation .*does not exist|column .*does not exist|permission denied|row.level security|Internal Server Error|Bad Gateway|Service Unavailable|Expected .*, received|Invalid (?:input|enum|uuid)|Required$|\bat .+\:\d+\:\d+|<\/?(?:html|body|!doctype)|A API não confirmou)/i;

function publicMessage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (!text || text.length > 600 || TECHNICAL_MESSAGE.test(text)) return undefined;
  return text;
}

/** Compatibilidade com erros de versões anteriores e bibliotecas do dispositivo. */
export function userErrorMessage(
  error: unknown,
  fallback: string = USER_ERROR_MESSAGES.default,
): string {
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : undefined;
  if (typeof message !== "string") return fallback;
  if (/Recurso .+ desativado para esta marca/i.test(message))
    return USER_ERROR_MESSAGES.unavailable;
  if (
    /Failed to fetch|Network request failed|NetworkError|Load failed|fetch failed/i.test(
      message,
    )
  )
    return USER_ERROR_MESSAGES.network;
  if (/TimeoutError|timed out|AbortError|operation was aborted/i.test(message))
    return USER_ERROR_MESSAGES.timeout;
  return publicMessage(message) ?? fallback;
}

export function apiErrorMessage(status: number, problem: unknown): string {
  const payload =
    problem && typeof problem === "object" && !Array.isArray(problem)
      ? (problem as { error?: unknown; message?: unknown; details?: unknown })
      : {};
  if (payload.error === "FEATURE_UNAVAILABLE") return USER_ERROR_MESSAGES.unavailable;
  if (status === 401) return USER_ERROR_MESSAGES.session;
  if (status === 429) return USER_ERROR_MESSAGES.busy;
  if (status === 408 || status === 504) return USER_ERROR_MESSAGES.timeout;
  if (status >= 500) return USER_ERROR_MESSAGES.default;
  if (status === 413)
    return "O arquivo ou conteúdo é muito grande. Reduza o tamanho e tente novamente.";
  if (payload.error === "VALIDATION_ERROR") {
    const details = Array.isArray(payload.details)
      ? payload.details
      : payload.details && typeof payload.details === "object"
        ? Object.values(payload.details).flat()
        : [];
    const messages = [
      ...new Set(
        details.map(publicMessage).filter((message): message is string => !!message),
      ),
    ];
    return messages.slice(0, 5).join("\n") || USER_ERROR_MESSAGES.validation;
  }
  const fallback =
    status === 403
      ? USER_ERROR_MESSAGES.forbidden
      : status === 404
        ? "Não encontramos este registro. Atualize a tela e tente novamente."
        : status === 409
          ? "Os dados foram alterados. Atualize a tela antes de tentar novamente."
          : status === 400 || status === 422
            ? USER_ERROR_MESSAGES.validation
            : USER_ERROR_MESSAGES.default;
  return userErrorMessage(payload.message, fallback);
}
