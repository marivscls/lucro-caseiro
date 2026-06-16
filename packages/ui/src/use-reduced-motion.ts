import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Respeita a preferência de acessibilidade "Reduzir movimento" do sistema.
 * Componentes animados usam isso para desligar/encurtar animações quando o
 * usuário pediu menos movimento. Default `false` (anima) até a leitura async.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduced(value);
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
