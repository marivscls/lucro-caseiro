export const CREDENTIAL_RULES =
  "Use pelo menos 8 caracteres, com letra maiúscula, minúscula e número.";

export function getRecoveryLinkError(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    const error = url.searchParams.get("error") ?? hash.get("error");
    const code = url.searchParams.get("error_code") ?? hash.get("error_code");

    if (!error && !code) return null;
    return "Este link de recuperação expirou, é inválido ou já foi usado. Peça um novo link.";
  } catch {
    return null;
  }
}

export function getPasswordUpdateError(error: { code?: string; message: string }): {
  kind: "validation" | "error";
  message: string;
} {
  const message = error.message.toLowerCase();

  if (error.code === "weak_password" || message.includes("weak password")) {
    return { kind: "validation", message: CREDENTIAL_RULES };
  }
  if (
    error.code === "same_password" ||
    message.includes("same password") ||
    message.includes("different from old password") ||
    message.includes("different from the old password")
  ) {
    return {
      kind: "validation",
      message: "A nova senha precisa ser diferente da senha anterior.",
    };
  }
  if (
    message.includes("session") ||
    message.includes("jwt") ||
    message.includes("expired")
  ) {
    return {
      kind: "error",
      message: "O link expirou ou já foi usado. Peça um novo link e tente novamente.",
    };
  }
  return {
    kind: "error",
    message: "Não foi possível alterar a senha. Tente novamente ou peça um novo link.",
  };
}
