import { createContext, useContext, useLayoutEffect } from "react";
import type { TextInput, View } from "react-native";

export const FieldInputContext = createContext<{
  register: (input: TextInput | null, previous: TextInput | null, value?: string) => void;
  error?: string;
  errorId: string;
  /** O campo desenha a própria borda de erro; o `ValidationField` não põe moldura extra. */
  claimOutline?: () => void;
} | null>(null);

/** The closest scroll container reveals text fields as well as pickers. */
export const ValidationScrollContext = createContext<((target: View) => void) | null>(
  null,
);

export function useFieldValidationError() {
  return useContext(FieldInputContext)?.error;
}

/**
 * Para campos que pintam a própria borda de erro (Input, TextField, SelectField…):
 * avisa o `ValidationField` para não desenhar a moldura extra e devolve o erro.
 */
export function useFieldOutlineError() {
  const field = useContext(FieldInputContext);
  const claim = field?.claimOutline;
  useLayoutEffect(() => {
    claim?.();
  }, [claim]);
  return field?.error;
}
