import { asyncStorage } from "./async-storage";

const SIGNED_IN_KEY = "auth:signed-in-on-device";

/** Marca que alguém já entrou neste aparelho (mostra o login direto da próxima vez). */
export function markSignedInOnDevice(): void {
  asyncStorage.setItem(SIGNED_IN_KEY, "1").catch(() => {});
}

/** Quem nunca entrou neste aparelho vê as boas-vindas com "Criar conta grátis". */
export async function hasSignedInOnDevice(): Promise<boolean> {
  try {
    return (await asyncStorage.getItem(SIGNED_IN_KEY)) === "1";
  } catch {
    return false;
  }
}
