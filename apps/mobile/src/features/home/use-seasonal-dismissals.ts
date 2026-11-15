import { useEffect, useState } from "react";
import { asyncStorage } from "../../shared/utils/async-storage";
import { parseDismissedSeasonalKeys } from "./seasonal-dates";

const storageKey = (userId: string) => `home-seasonal-dismissed:v1:${userId}`;

/**
 * Datas comerciais que a pessoa dispensou no Início (por chave "natal-2026").
 * `loaded` fica false até a leitura terminar, para o cartão não piscar.
 * Falha de armazenamento nunca quebra o Início: lê como vazio e ignora a escrita.
 */
export function useSeasonalDismissals(rawUserId: string | null, now: Date) {
  // Sem sessão (modo demonstração), guarda no aparelho sob uma chave local.
  const userId = rawUserId ?? "local";
  const [state, setState] = useState<{ userId: string; keys: string[] } | null>(null);
  const year = now.getFullYear();

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const reference = new Date(year, 0, 1, 12);
    void (async () => {
      let keys: string[] = [];
      try {
        keys = parseDismissedSeasonalKeys(
          await asyncStorage.getItem(storageKey(userId)),
          reference,
        );
      } catch {
        keys = [];
      }
      if (active) setState({ userId, keys });
    })();
    return () => {
      active = false;
    };
  }, [userId, year]);

  const keys = state && state.userId === userId ? state.keys : [];
  return {
    loaded: !!userId && state?.userId === userId,
    dismissed: keys,
    dismiss: (key: string) => {
      if (!userId) return;
      const next = keys.includes(key) ? keys : [...keys, key];
      setState({ userId, keys: next });
      void (async () => {
        try {
          await asyncStorage.setItem(storageKey(userId), JSON.stringify(next));
        } catch {
          // Sem armazenamento, o cartão some só nesta sessão.
        }
      })();
    },
  };
}
